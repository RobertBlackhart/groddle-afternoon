<?php
/**
 * Runs the site repo's new-email confirmation (groddle-afternoon-site src/EmailChanges.php and the
 * account/email routes in src/PlayerAccount.php) against a throwaway MariaDB database, and prints
 * what happened as JSON (tests/email-change-confirm.test.js). The database is made here
 * (test_groddle_email_<hex>: users, usermeta, options and the site's own tables from its minn.json)
 * and dropped at the end; nothing else is touched. Sending mail needs the engine's whole runtime, so
 * the PUT runs here up to its mail (every refusal before it) and the confirm runs for an account
 * whose old address is not one (no notice to send) and a browser signed in as nobody; the mails and
 * the signed-in path are checked on a local site instead.
 *
 *   php tests/fixtures/email-change/email-change.php <engine public/minn> <groddle-afternoon-site> <host> <user> <pass>
 */

declare(strict_types=1);

[, $engine, $extension, $host, $user, $pass] = $argv;
define('ABSPATH', sys_get_temp_dir() . '/groddle-email-none/');
define('MINN_ENGINE_DIR', $engine);
require $engine . '/src/Minn/Autoloader.php';
Minn\Autoloader::register();
spl_autoload_register(static function (string $class) use ($extension): void {
    $prefix = 'Groddle\\Minn\\';
    if (str_starts_with($class, $prefix) && is_file($file = $extension . '/src/' . substr($class, strlen($prefix)) . '.php')) {
        require $file;
    }
});
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

use Groddle\Minn\Characters;
use Groddle\Minn\EmailChanges;
use Groddle\Minn\Logins;
use Groddle\Minn\PlayerAccount;
use Groddle\Minn\PlayerMail;
use Groddle\Minn\Signups;
use Minn\Auth\Capabilities;
use Minn\Auth\Password;
use Minn\Content\Reader;
use Minn\Content\Site;
use Minn\Db;
use Minn\Extension\Seams;
use Minn\Http\Method;
use Minn\Http\Request;
use Minn\Http\Response;
use Minn\RestError;
use Minn\Support\Slashes;

const PREFIX = 'wp_';

function connect(string $host, string $user, string $pass, ?string $db = null): mysqli
{
    $m = new mysqli($host, $user, $pass, $db ?? '');
    $m->set_charset('utf8mb4');
    return $m;
}

$name = 'test_groddle_email_' . bin2hex(random_bytes(4));
$root = connect($host, $user, $pass);
$root->query("CREATE DATABASE `{$name}`");
$out = ['db' => $name];
try {
    $conn = connect($host, $user, $pass, $name);
    $manifest = json_decode((string) file_get_contents($extension . '/minn.json'), true);
    foreach ([EmailChanges::TABLE, Logins::TABLE, Characters::TABLE, 'groddle_mail_sends'] as $t) {
        $conn->query('CREATE TABLE ' . PREFIX . $t . ' (' . implode(', ', $manifest['tables'][$t]) . ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }
    $conn->query('CREATE TABLE ' . PREFIX . "users (ID bigint(20) unsigned NOT NULL AUTO_INCREMENT, user_login varchar(60) NOT NULL DEFAULT '', user_pass varchar(255) NOT NULL DEFAULT '', user_nicename varchar(50) NOT NULL DEFAULT '', user_email varchar(100) NOT NULL DEFAULT '', user_url varchar(100) NOT NULL DEFAULT '', user_registered datetime NOT NULL, user_activation_key varchar(255) NOT NULL DEFAULT '', user_status int(11) NOT NULL DEFAULT 0, display_name varchar(250) NOT NULL DEFAULT '', PRIMARY KEY (ID)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $conn->query('CREATE TABLE ' . PREFIX . "options (option_id bigint(20) unsigned NOT NULL AUTO_INCREMENT, option_name varchar(191) NOT NULL DEFAULT '', option_value longtext NOT NULL, autoload varchar(20) NOT NULL DEFAULT 'yes', PRIMARY KEY (option_id), UNIQUE KEY option_name (option_name)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $conn->query('CREATE TABLE ' . PREFIX . 'usermeta (umeta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT, user_id bigint(20) unsigned NOT NULL DEFAULT 0, meta_key varchar(255) DEFAULT NULL, meta_value longtext, PRIMARY KEY (umeta_id), KEY user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db = new Db($conn, PREFIX);
    $site = new Site($db);
    $now = time();
    $at = static fn (int $t): string => gmdate('Y-m-d H:i:s', $t);
    $hash = Password::hash((string) Slashes::add('zz-right-pass'));

    // == The people: Ada (a login with an extra character, Bea), Dot (another player) ==
    $person = static function (int $id, string $name, string $email) use ($db, $at, $hash, $now): void {
        $db->execute('INSERT INTO ' . $db->table('users') . ' (ID, user_login, user_pass, user_email, user_registered, user_activation_key, display_name) VALUES (?, ?, ?, ?, ?, ?, ?)', [$id, "player-{$id}", $hash, $email, $at($now - 86400), '1700000000:$P$resetkey', $name]);
        $db->execute('INSERT INTO ' . $db->table('usermeta') . ' (user_id, meta_key, meta_value) VALUES (?, ?, ?)', [$id, PREFIX . 'capabilities', serialize(['subscriber' => true])]);
        $db->execute('INSERT INTO ' . $db->table('usermeta') . " (user_id, meta_key, meta_value) VALUES (?, 'session_tokens', ?)", [$id, serialize(['abc' => ['expiration' => $now + 86400]])]);
        $db->execute('INSERT INTO ' . $db->table(Characters::TABLE) . ' (user_id, name, name_key, created_at) VALUES (?, ?, ?, ?)', [$id, $name, strtolower($name), $at($now - 86400)]);
    };
    $person(10, 'Ada', 'not-an-address');
    $beaEmail = Logins::email();
    $person(11, 'Bea', $beaEmail);
    (new Logins($db))->link(11, 10, $now - 3600);
    $person(20, 'Dot', 'dot@example.com');

    $caps = Capabilities::fromDb($db);
    $request = static fn (Method $method, array $body = [], string $from = '203.0.113.7'): Request => new Request($method, '/', [], [], [], $body === [] ? '' : json_encode($body), true, 'groddle.test', remoteAddress: $from);
    $routes = static fn (int $as, Request $r): PlayerAccount => new PlayerAccount(new Seams($db, $site, $r, Reader::forUser($as, $caps, '', 'token-' . $as)));
    $answer = static function (Closure $call): array {
        try {
            $r = $call();
            return ['status' => $r->status, 'body' => json_decode($r->body, true)];
        } catch (RestError $e) {
            return ['status' => $e->status, 'code' => $e->errorCode];
        }
    };
    $put = static fn (int $as, array $body, string $from = '203.0.113.7'): array => $answer(static fn (): Response => $routes($as, $r = $request(Method::Put, $body, $from))->changeEmail($r));
    $confirm = static fn (int $as, string $token): array => $answer(static fn (): Response => $routes($as, $r = $request(Method::Post, ['token' => $token]))->confirmEmail($r));
    $email = static fn (int $id): string => (string) $db->value('SELECT user_email FROM ' . $db->table('users') . ' WHERE ID = ?', [$id]);

    // == The PUT's refusals, each before anything is held or mailed (Bea asks: the login is Ada's) ==
    $out['put'] = [
        'wrongPassword' => $put(11, ['current' => 'zz-wrong-pass', 'email' => 'ada-new@example.com']),
        'badEmail' => $put(11, ['current' => 'zz-right-pass', 'email' => 'not an email']),
        'same' => $put(20, ['current' => 'zz-right-pass', 'email' => 'DOT@example.com']),
        'taken' => $put(11, ['current' => 'zz-right-pass', 'email' => 'Dot@Example.com']),
    ];
    $out['heldAfterRefusals'] = (int) $db->value('SELECT COUNT(*) FROM ' . $db->table(EmailChanges::TABLE));
    $out['throttle'] = (new \Minn\Auth\LoginThrottle($db))->retryAfter('203.0.113.7') === null ? 'counting' : 'stopped';
    // Twenty wrong passwords from one address and the next ask waits, however right its password.
    for ($i = 0; $i < 20; $i++) {
        $put(11, ['current' => 'zz-wrong-pass', 'email' => 'ada-new@example.com'], '198.51.100.9');
    }
    $out['throttled'] = $put(11, ['current' => 'zz-right-pass', 'email' => 'ada-new@example.com'], '198.51.100.9');

    // == EmailChanges: one row per login, a newer ask replaces an older link, the limits ==
    $changes = new EmailChanges($db);
    $first = $changes->hold(10, 'ada-new@example.com', '2001:db8:abcd:12::5', $now - 20);
    $row = $changes->forLogin(10);
    $out['held'] = [
        'looks' => EmailChanges::looksLikeToken($first),
        'storedHash' => $row['token_hash'] === hash('sha256', $first),
        'noToken' => !in_array($first, $row, true),
        'email' => $row['email'],
        'sends' => (int) $row['sends'],
        'ip' => $row['ip'],
        'pending' => EmailChanges::pending($row, $now),
        'unchanged' => $email(10),
    ];
    $out['putWait'] = $put(11, ['current' => 'zz-right-pass', 'email' => 'ada-other@example.com'], '192.0.2.4');
    $db->execute('UPDATE ' . $db->table(EmailChanges::TABLE) . ' SET sent_at = ? WHERE user_id = 10', [$at($now - 61)]);
    $out['sendRefusal'] = ['afterGap' => EmailChanges::sendRefusal($changes->forLogin(10), $now)];
    $second = $changes->hold(10, 'ada-newer@example.com', '203.0.113.7', $now - 30);
    $out['replaced'] = ['oldLink' => $changes->byToken($first), 'rows' => (int) $db->value('SELECT COUNT(*) FROM ' . $db->table(EmailChanges::TABLE) . ' WHERE user_id = 10'), 'sends' => (int) $changes->forLogin(10)['sends'], 'email' => $changes->forLogin(10)['email']];
    $db->execute('UPDATE ' . $db->table(EmailChanges::TABLE) . ' SET sends = ?, sent_at = ? WHERE user_id = 10', [EmailChanges::MAX_SENDS, $at($now - 600)]);
    $out['sendRefusal']['spent'] = EmailChanges::sendRefusal($changes->forLogin(10), $now);
    $out['putSpent'] = $put(11, ['current' => 'zz-right-pass', 'email' => 'ada-other@example.com'], '192.0.2.4');
    $out['sendRefusal']['expiredStartsAfresh'] = EmailChanges::sendRefusal(['used_at' => null, 'expires_at' => $at($now - 1), 'sends' => 99, 'sent_at' => $at($now - 10)], $now);
    $out['sendRefusal']['none'] = EmailChanges::sendRefusal(null, $now);

    // == The link: unknown, then the change (once), then used; the old link from before does nothing ==
    $out['confirm'] = [
        'garbage' => $confirm(0, 'nope'),
        'oldLink' => $confirm(0, $first),
    ];
    $out['confirm']['ok'] = $confirm(0, $second);
    $out['after'] = [
        'email' => $email(10),
        'extraUnchanged' => $email(11) === $beaEmail,
        'resetKeyCleared' => (string) $db->value('SELECT user_activation_key FROM ' . $db->table('users') . ' WHERE ID = 10') === '',
        'otherResetKeyKept' => (string) $db->value('SELECT user_activation_key FROM ' . $db->table('users') . ' WHERE ID = 20') !== '',
        'sessionsEnded' => array_map(static fn (int $id): string => (string) $db->value('SELECT meta_value FROM ' . $db->table('usermeta') . " WHERE user_id = ? AND meta_key = 'session_tokens'", [$id]), [10, 11]),
        'otherSessionsKept' => str_contains((string) $db->value('SELECT meta_value FROM ' . $db->table('usermeta') . " WHERE user_id = 20 AND meta_key = 'session_tokens'"), '"abc"'),
    ];
    $out['confirm']['again'] = $confirm(0, $second);

    // == Expired, and an address someone took while the link waited ==
    $third = $changes->hold(20, 'dot-new@example.com', '203.0.113.7', $now - EmailChanges::LIFETIME - 5);
    $out['confirm']['expired'] = $confirm(0, $third);
    $fourth = $changes->hold(20, 'ada-newer@example.com', '203.0.113.7', $now);
    $out['confirm']['takenSince'] = $confirm(0, $fourth);
    $out['takenSinceLeftAlone'] = ['email' => $email(20), 'linkStillWaiting' => ($changes->forLogin(20)['used_at'] ?? null) === null];

    // == Rows go a week after they expire ==
    $changes->purge($now + EmailChanges::LIFETIME + EmailChanges::KEEP + 10);
    $out['purged'] = (int) $db->value('SELECT COUNT(*) FROM ' . $db->table(EmailChanges::TABLE));

    // == The email to the new address ==
    $link = 'https://groddle.example/play/online/#email=' . str_repeat('0a', 24);
    [$subject, $html, $headers] = PlayerMail::confirmEmail('https://groddle.example/', '', $link, 'Zz <b>Bold</b> & Co');
    $out['mail'] = ['subject' => $subject, 'html' => $html, 'headers' => $headers];
    $out['limits'] = ['lifetime' => EmailChanges::LIFETIME, 'keep' => EmailChanges::KEEP, 'maxSends' => EmailChanges::MAX_SENDS, 'gap' => EmailChanges::RESEND_GAP, 'tokenShape' => Signups::looksLikeToken($second)];
} catch (Throwable $e) {
    $out['error'] = get_class($e) . ': ' . $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine();
} finally {
    $root->query("DROP DATABASE IF EXISTS `{$name}`");
    $out['dropped'] = (int) $root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$name}'")->fetch_row()[0] === 0;
}
echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
