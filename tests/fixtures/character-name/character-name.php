<?php
/**
 * Runs the site repo's change of name (groddle-afternoon-site src/CharacterName.php, register G1213,
 * report #636) against a throwaway MariaDB database and prints what happened as JSON
 * (tests/g1213-change-name.test.js): the name rules, the 30 day wait, the 1,000 currants out of the
 * ledger in the same transaction (a settled trade with nobody that a save applies once), the old
 * address kept, and "formerly" for 30 days after a player's own rename only. The database is made here
 * (test_groddle_rename_<hex>: users, usermeta, options and the site's own tables from its minn.json)
 * and dropped at the end; nothing else is touched. No realtime server answers (no secret): live false.
 *
 *   php tests/fixtures/character-name/character-name.php <engine public/minn> <groddle-afternoon-site> <host> <user> <pass>
 */

declare(strict_types=1);

[, $engine, $extension, $host, $user, $pass] = $argv;
define('ABSPATH', sys_get_temp_dir() . '/groddle-rename-none/');
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

use Groddle\Minn\AdminConsole;
use Groddle\Minn\CharacterName;
use Groddle\Minn\CharacterRoutes;
use Groddle\Minn\Characters;
use Groddle\Minn\Ledger;
use Groddle\Minn\Logins;
use Groddle\Minn\PlayerPages;
use Groddle\Minn\Profiles;
use Minn\Auth\Capabilities;
use Minn\Content\Reader;
use Minn\Content\Site;
use Minn\Db;
use Minn\Extension\Seams;
use Minn\Http\Method;
use Minn\Http\Request;
use Minn\Http\Response;
use Minn\RestError;

const PREFIX = 'wp_';
const DAY = 86400;

function connect(string $host, string $user, string $pass, ?string $db = null): mysqli
{
    $m = new mysqli($host, $user, $pass, $db ?? '');
    $m->set_charset('utf8mb4');
    return $m;
}

$name = 'test_groddle_rename_' . bin2hex(random_bytes(4));
$root = connect($host, $user, $pass);
$root->query("CREATE DATABASE `{$name}`");
$out = ['db' => $name];
try {
    $conn = connect($host, $user, $pass, $name);
    $manifest = json_decode((string) file_get_contents($extension . '/minn.json'), true);
    foreach ([Logins::TABLE, AdminConsole::RENAMES, AdminConsole::ACTIONS, Characters::TABLE, AdminConsole::BANS, 'groddle_mp_saves', 'groddle_signups', Ledger::TABLE, Ledger::ITEMS, Ledger::TRADES, Ledger::LOG, Ledger::CREDITED] as $t) {
        $conn->query('CREATE TABLE ' . PREFIX . $t . ' (' . implode(', ', $manifest['tables'][$t]) . ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }
    $conn->query('CREATE TABLE ' . PREFIX . "users (ID bigint(20) unsigned NOT NULL AUTO_INCREMENT, user_login varchar(60) NOT NULL DEFAULT '', user_pass varchar(255) NOT NULL DEFAULT '', user_nicename varchar(50) NOT NULL DEFAULT '', user_email varchar(100) NOT NULL DEFAULT '', user_url varchar(100) NOT NULL DEFAULT '', user_registered datetime NOT NULL, user_activation_key varchar(255) NOT NULL DEFAULT '', user_status int(11) NOT NULL DEFAULT 0, display_name varchar(250) NOT NULL DEFAULT '', PRIMARY KEY (ID)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $conn->query('CREATE TABLE ' . PREFIX . "options (option_id bigint(20) unsigned NOT NULL AUTO_INCREMENT, option_name varchar(191) NOT NULL DEFAULT '', option_value longtext NOT NULL, autoload varchar(20) NOT NULL DEFAULT 'yes', PRIMARY KEY (option_id), UNIQUE KEY option_name (option_name)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $conn->query('CREATE TABLE ' . PREFIX . 'usermeta (umeta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT, user_id bigint(20) unsigned NOT NULL DEFAULT 0, meta_key varchar(255) DEFAULT NULL, meta_value longtext, PRIMARY KEY (umeta_id), KEY user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db = new Db($conn, PREFIX);
    $site = new Site($db);
    $now = time();
    $at = static fn (int $t): string => gmdate('Y-m-d H:i:s', $t);
    $ledger = new Ledger($db, Groddle\Minn\Economy::shared(), Ledger::RATE, Ledger::CAPACITY);

    // == The people, each with currants in their ledger ==
    $person = static function (int $id, string $name, string $email, int $currants) use ($db, $at, $now, $ledger): void {
        $db->execute('INSERT INTO ' . $db->table('users') . ' (ID, user_login, user_pass, user_email, user_registered, display_name) VALUES (?, ?, ?, ?, ?, ?)', [$id, "player-{$id}", '$P$none', $email, $at($now - 90 * DAY), $name]);
        $db->execute('INSERT INTO ' . $db->table('usermeta') . ' (user_id, meta_key, meta_value) VALUES (?, ?, ?)', [$id, PREFIX . 'capabilities', serialize(['subscriber' => true])]);
        $db->execute('INSERT INTO ' . $db->table('usermeta') . " (user_id, meta_key, meta_value) VALUES (?, 'nickname', ?)", [$id, $name]);
        $db->execute('INSERT INTO ' . $db->table(Characters::TABLE) . ' (user_id, name, name_key, created_at) VALUES (?, ?, ?, ?)', [$id, $name, strtolower($name), $at($now - 90 * DAY + $id)]);
        $db->transaction(static fn () => $ledger->lock($id, $now));
        $db->execute('UPDATE ' . $db->table(Ledger::TABLE) . ' SET currants = ? WHERE user_id = ?', [$currants, $id]);
    };
    $person(1, 'Zz Admin', 'zz-admin@groddle.test', 0);
    $db->execute('UPDATE ' . $db->table('usermeta') . ' SET meta_value = ? WHERE user_id = 1 AND meta_key = ?', [serialize(['administrator' => true]), PREFIX . 'capabilities']);
    $person(10, 'Ada', 'ada@example.com', 1500);
    $person(11, 'Bea', 'bea@example.com', 5000);
    $person(20, 'Cyd', 'cyd@example.com', 300);
    $person(30, 'Dot', 'dot@example.com', 2000);
    $person(40, 'Eve', 'eve@example.com', 5000);

    $caps = Capabilities::fromDb($db);
    $request = static fn (Method $method, array $body = [], array $headers = []): Request => new Request($method, '/', [], $headers, [], $body === [] ? '' : json_encode($body), true, 'groddle.test');
    $as = static fn (int $id, Request $r): CharacterName => new CharacterName(new Seams($db, $site, $r, Reader::forUser($id, $caps, '', 'token-' . $id)));
    $answer = static function (Closure $call): array {
        try {
            $r = $call();
            return ['status' => $r->status, 'body' => json_decode($r->body, true)];
        } catch (RestError $e) {
            return ['status' => $e->status, 'code' => $e->errorCode];
        }
    };
    $read = static fn (int $id): array => $answer(static fn (): Response => $as($id, $request(Method::Get))->read($request(Method::Get)));
    $change = static function (int $id, mixed $to, array $headers = []) use ($answer, $as, $request): array {
        $r = $request(Method::Post, ['name' => $to], $headers);
        return $answer(static fn (): Response => $as($id, $r)->change($r));
    };
    $currants = static fn (int $id): int => (int) $db->value('SELECT currants FROM ' . $db->table(Ledger::TABLE) . ' WHERE user_id = ?', [$id]);

    $out['before'] = $read(10);
    $out['refusals'] = [
        'short' => $change(10, 'x'),
        'filter' => $change(10, 'Ada ' . ucfirst((string) (json_decode((string) file_get_contents($extension . '/data/word-filter.json'), true)['stems'][0] ?? 'x'))),
        'taken' => $change(10, 'bea'),
        'same' => $change(10, 'Ada'),
        'poor' => $change(20, 'Cyd Rich'),
        'otherWindow' => $change(10, 'Ada Two', ['x-groddle-character' => '11']),
    ];
    $out['afterRefusals'] = ['currants' => $currants(10), 'trades' => (int) $db->value('SELECT COUNT(*) FROM ' . $db->table(Ledger::TRADES)), 'renames' => (int) $db->value('SELECT COUNT(*) FROM ' . $db->table(AdminConsole::RENAMES))];

    // == The change ==
    $oldSlugs = Profiles::slugs($db);
    $out['renamed'] = $change(10, '  Ada   Two ');
    $op = (string) ($out['renamed']['body']['receipt']['op'] ?? '');
    $out['stored'] = [
        'currants' => $currants(10),
        'name' => (string) $db->value('SELECT name FROM ' . $db->table(Characters::TABLE) . ' WHERE user_id = 10'),
        'display' => (string) $db->value('SELECT display_name FROM ' . $db->table('users') . ' WHERE ID = 10'),
        'nickname' => (string) $db->value('SELECT meta_value FROM ' . $db->table('usermeta') . " WHERE user_id = 10 AND meta_key = 'nickname'"),
        'trade' => $db->row('SELECT status, a_id, b_id, a_gave, b_gave, a_applied_at IS NULL AS waiting FROM ' . $db->table(Ledger::TRADES) . ' WHERE trade_id = ?', [$op]),
        'row' => $db->row('SELECT user_id, old_name, old_slug, new_name, admin_user_id FROM ' . $db->table(AdminConsole::RENAMES) . ' WHERE user_id = 10'),
        'log' => json_decode((string) $db->value('SELECT detail FROM ' . $db->table(Ledger::LOG) . " WHERE user_id = 10 AND kind = 'spend'"), true),
        'oldHeld' => (new Characters($db))->taken('Ada'),
        'pending' => array_column($db->transaction(static fn () => $ledger->pending(10, null, $now)), 'trade'),
        'oldSlug' => $oldSlugs[10] ?? null,
    ];
    $slugs = Profiles::slugs($db);
    $out['redirect'] = PlayerPages::renamed($db, 'ada', $slugs);
    $out['after'] = $read(10);
    $out['again'] = $change(10, 'Ada Three');
    $out['nextAtAfter30'] = CharacterName::nextAt($db, 10, $now + 30 * DAY + 1);
    $out['waitWords'] = CharacterName::waitWords($now + 3 * DAY + 60, $now);
    $out['formerly'] = [
        'now' => CharacterName::formerly($db, [10, 11], $now),
        'day29' => CharacterName::formerly($db, [10], $now + 29 * DAY),
        'day31' => CharacterName::formerly($db, [10], $now + 31 * DAY),
    ];

    // == Only the letter case of your own name; an administrator's rename shows no "formerly" and starts no wait ==
    $out['caseOnly'] = $change(30, 'DOT');
    $console = static fn (Request $r): AdminConsole => new AdminConsole(new Seams($db, $site, $r, Reader::forUser(1, $caps, '', 'token-1')));
    $adminReq = $request(Method::Post, ['name' => 'Eve Renamed']);
    $out['adminRename'] = $answer(static fn (): Response => $console($adminReq)->rename($adminReq, '40'));
    // == The old name is held for 30 days (Logins::NAME_HOLD, as a retired character's): nobody else gets it ==
    $chars = new Characters($db);
    $newChar = $request(Method::Post, ['name' => 'ada']);
    $out['hold'] = [
        'other' => $chars->taken('ADA', $now),
        'self' => $chars->taken('Ada', $now, 10),
        'day29' => $chars->taken('Ada', $now + 29 * DAY),
        'day31' => $chars->taken('Ada', $now + 31 * DAY),
        'newCharacter' => $answer(static fn (): Response => (new CharacterRoutes(new Seams($db, $site, $newChar, Reader::forUser(20, $caps, '', 'token-20'))))->create($newChar)),
        'otherRename' => $change(20, 'Ada'),
    ];
    // Taking it back: only once the 30 day wait allows a change at all.
    $db->execute('UPDATE ' . $db->table(AdminConsole::RENAMES) . ' SET renamed_at = ? WHERE user_id = 10', [$at($now - 30 * DAY + 60)]);
    $out['hold']['backTooSoon'] = $change(10, 'Ada');
    $db->execute('UPDATE ' . $db->table(AdminConsole::RENAMES) . ' SET renamed_at = ? WHERE user_id = 10', [$at($now - 30 * DAY - 60)]);
    $db->execute('UPDATE ' . $db->table(Ledger::TABLE) . ' SET currants = 1500 WHERE user_id = 10');
    $out['hold']['backAfterWait'] = $change(10, 'Ada');
    $out['caseFormerly'] = CharacterName::formerly($db, [30], $now);
    $out['afterAdmin'] = ['formerly' => CharacterName::formerly($db, [40], $now), 'nextAt' => CharacterName::nextAt($db, 40, $now)];
    $out['afterAdminChange'] = $change(40, 'Eve Again');
    $out['afterAdminFormerly'] = CharacterName::formerly($db, [40], $now);
    $out['adminHoldsNothing'] = ['eve' => $chars->taken('Eve', $now), 'eveRenamed' => $chars->taken('Eve Renamed', $now)];

    // == A suspended player can't ==
    $db->execute('INSERT INTO ' . $db->table(AdminConsole::BANS) . " (user_id, reason, admin_user_id, created_at) VALUES (11, 'x', 1, ?)", [$at($now)]);
    $out['banned'] = $change(11, 'Bea Two');
} catch (Throwable $e) {
    $out['error'] = get_class($e) . ': ' . $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine();
} finally {
    $root->query("DROP DATABASE IF EXISTS `{$name}`");
    $out['dropped'] = (int) $root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$name}'")->fetch_row()[0] === 0;
}
echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
