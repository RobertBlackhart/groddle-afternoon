<?php
/**
 * Runs the site repo's furniture sales (groddle-afternoon-site src/LedgerFurniture.php, with the
 * Ledger it pays through) against a throwaway MariaDB database and prints what happened as JSON
 * (tests/furniture-sales-unlimited.test.js). Austin 2026-11-25: no limit on the pieces a house has
 * on sale at once (it was 60, "You have a lot on sale already."), and every pile of currants waiting
 * for the owner is in the owner's answer (it was the first 100) and can be collected. The owner sets
 * 150 prices at once; a visitor buys 250 pieces, as the realtime server asks (signed, ServiceCall);
 * the owner is sent all 250 piles and collects each. The database (test_groddle_sales_<hex>) is made
 * here and dropped at the end. The players are made-up fixtures.
 *
 *   php tests/fixtures/furniture-sales/sales-unlimited.php <engine public/minn> <groddle-afternoon-site> <host> <user> <pass>
 */

declare(strict_types=1);

[, $engine, $extension, $host, $user, $pass] = $argv;
define('ABSPATH', sys_get_temp_dir() . '/');
define('MINN_ENGINE_DIR', $engine);
define('GRODDLE_REALTIME_SECRET', str_repeat('k', 48));
require $engine . '/src/Minn/Autoloader.php';
Minn\Autoloader::register();
spl_autoload_register(static function (string $class) use ($extension): void {
    $prefix = 'Groddle\\Minn\\';
    if (str_starts_with($class, $prefix) && is_file($file = $extension . '/src/' . substr($class, strlen($prefix)) . '.php')) {
        require $file;
    }
});
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

use Groddle\Minn\Economy;
use Groddle\Minn\Ledger;
use Groddle\Minn\LedgerFurniture;
use Groddle\Minn\MultiplayerSave;
use Groddle\Minn\ServiceCall;
use Minn\Auth\Capabilities;
use Minn\Content\Reader;
use Minn\Content\Site;
use Minn\Db;
use Minn\Extension\Seams;
use Minn\Http\Method;
use Minn\Http\Request;
use Minn\RestError;

const PREFIX = 'wp_';
const OWNER = 7;
const VISITOR = 9;
const PIECES = 260;
const CLASS_TSID = 'furniture_chair';

function connect(string $host, string $user, string $pass, ?string $db = null): mysqli
{
    $m = new mysqli($host, $user, $pass, $db ?? '');
    $m->set_charset('utf8mb4');
    return $m;
}

$name = 'test_groddle_sales_' . bin2hex(random_bytes(4));
$root = connect($host, $user, $pass);
$root->query("CREATE DATABASE `{$name}`");
$out = ['db' => $name];
try {
    $conn = connect($host, $user, $pass, $name);
    $manifest = json_decode((string) file_get_contents($extension . '/minn.json'), true);
    foreach ($manifest['tables'] as $t => $cols) {
        $conn->query('CREATE TABLE ' . PREFIX . $t . ' (' . implode(', ', $cols) . ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }
    $conn->query('CREATE TABLE ' . PREFIX . "options (option_id bigint(20) unsigned NOT NULL AUTO_INCREMENT, option_name varchar(191) NOT NULL DEFAULT '', option_value longtext NOT NULL, autoload varchar(20) NOT NULL DEFAULT 'yes', PRIMARY KEY (option_id), UNIQUE KEY option_name (option_name)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $conn->query('CREATE TABLE ' . PREFIX . 'usermeta (umeta_id bigint(20) unsigned NOT NULL AUTO_INCREMENT, user_id bigint(20) unsigned NOT NULL DEFAULT 0, meta_key varchar(255) DEFAULT NULL, meta_value longtext, PRIMARY KEY (umeta_id), KEY user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $conn->query('CREATE TABLE ' . PREFIX . "users (ID bigint(20) unsigned NOT NULL AUTO_INCREMENT, user_login varchar(60) NOT NULL DEFAULT '', user_pass varchar(255) NOT NULL DEFAULT '', user_nicename varchar(50) NOT NULL DEFAULT '', user_email varchar(100) NOT NULL DEFAULT '', user_url varchar(100) NOT NULL DEFAULT '', user_registered datetime NOT NULL, user_activation_key varchar(255) NOT NULL DEFAULT '', user_status int(11) NOT NULL DEFAULT 0, display_name varchar(250) NOT NULL DEFAULT '', PRIMARY KEY (ID)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db = new Db($conn, PREFIX);
    $site = new Site($db);
    $site->setOption('home', 'https://groddle.test');
    $now = time();
    foreach ([OWNER => 'Owner', VISITOR => 'Visitor'] as $id => $who) {
        $db->execute('INSERT INTO ' . $db->table('users') . " (ID, user_login, user_registered, display_name) VALUES (?, ?, '2026-01-01 00:00:00', ?)", [$id, strtolower($who), $who]);
    }

    // —— The owner's house with PIECES chairs placed; a visitor with currants to spend ——
    $placed = [];
    for ($i = 1; $i <= PIECES; $i++) {
        $placed[] = ['id' => $i, 'classTsid' => CLASS_TSID, 'x' => 10 * $i];
    }
    $state = static fn (array $inv, int $currants, array $placed): array => [
        'inventory' => (object) $inv,
        'player' => ['currants' => $currants],
        'systems' => ['home' => ['owned' => true], 'features' => ['homes' => ['decor' => ['wallSegments' => 7, 'placed' => $placed, 'storage' => (object) []]]]],
    ];
    $saves = [OWNER => $state([CLASS_TSID => PIECES], 0, $placed), VISITOR => $state([], 1000000, [])];
    foreach ($saves as $id => $s) {
        $db->execute('INSERT INTO ' . $db->table(MultiplayerSave::TABLE) . ' (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)',
            [$id, json_encode(['kind' => 'groddle-multiplayer', 'format' => 1, 'entries' => ['playerState' => json_encode($s)]]), gmdate('Y-m-d H:i:s', $now)]);
    }
    $ledger = new Ledger($db, Economy::shared(), Ledger::RATE, Ledger::CAPACITY);
    Ledger::atomically($db, function () use ($ledger, $now): void {
        foreach ([OWNER, VISITOR] as $id) {
            $ledger->lock($id, $now);
        }
    });
    $currantsOf = static fn (int $id): int => (int) ($ledger->peek($id)['currants'] ?? -1);
    $out['seeded'] = ['owner' => ((array) $ledger->peek(OWNER)['items'])[CLASS_TSID] ?? 0, 'visitor' => $currantsOf(VISITOR)];

    $caps = Capabilities::fromDb($db);
    $seams = static fn (int $as, Request $r): Seams => new Seams($db, $site, $r, Reader::forUser($as, $caps, '', $as > 0 ? 'token-' . $as : ''));
    $asOwner = static function (Method $m, string $path, string $body, callable $call) use ($seams): array {
        $r = new Request($m, $path, [], [], [], $body, true, 'groddle.test');
        try {
            $res = $call(new LedgerFurniture($seams(OWNER, $r)), $r);
            return ['http' => $res->status] + json_decode($res->body, true);
        } catch (RestError $e) {
            return ['http' => $e->status, 'code' => $e->errorCode, 'text' => $e->getMessage()];
        }
    };
    $price = static fn (int $uid, int $p): array => $asOwner(Method::Put, '/groddle/v1/homes/sales', (string) json_encode(['uid' => $uid, 'price' => $p]), static fn (LedgerFurniture $f, Request $r) => $f->price($r));
    $mine = static fn (): array => $asOwner(Method::Get, '/groddle/v1/homes/sales', '', static fn (LedgerFurniture $f, Request $r) => $f->mine($r));
    $collect = static fn (string $op): array => $asOwner(Method::Post, "/groddle/v1/homes/sales/{$op}/collect", '', static fn (LedgerFurniture $f, Request $r) => $f->collect($r, $op));
    // As the realtime server posts a purchase (homes_street.go furn_buy): signed with the shared secret.
    $buy = static function (string $op, int $p) use ($seams): array {
        $json = (string) json_encode(['op' => $op, 'buyer' => VISITOR, 'owner' => OWNER, 'price' => $p]);
        $sig = ServiceCall::sign('POST', LedgerFurniture::ROUTE, time(), bin2hex(random_bytes(8)), $json, GRODDLE_REALTIME_SECRET);
        $r = new Request(Method::Post, LedgerFurniture::ROUTE, [], [ServiceCall::HEADER => $sig], [], $json, true, 'groddle.test');
        try {
            $res = (new LedgerFurniture($seams(0, $r)))->buy($r);
            return ['http' => $res->status] + json_decode($res->body, true);
        } catch (RestError $e) {
            return ['http' => $e->status, 'code' => $e->errorCode];
        }
    };

    // —— 150 pieces on sale at once (the old cap refused the 61st) ——
    $refused = [];
    for ($uid = 1; $uid <= 150; $uid++) {
        $a = $price($uid, $uid);
        if ($a['http'] !== 200) {
            $refused[] = [$uid, $a['code'] ?? '', $a['text'] ?? ''];
        }
    }
    $out['priceRefused'] = $refused;
    $m = $mine();
    $out['listed150'] = count($m['listed'] ?? []);

    // —— A visitor buys 250: what is on sale, then 50 more at a time (never over the old cap of 60,
    // so the piles are tested on their own) ——
    $bought = [];
    $buyFails = [];
    while (count($bought) < 250 && count($buyFails) < 5) {
        foreach ($mine()['listed'] ?? [] as $l) {
            $a = $buy($l['op'], $l['price']);
            if (($a['status'] ?? '') === 'settled') {
                $bought[$l['uid']] = true;
            } else {
                $buyFails[] = [$l['uid'], $a];
            }
        }
        // The pieces the old cap refused are still unsold: put them up again, then new ones.
        $batch = 0;
        for ($uid = 1; $uid <= PIECES && $batch < 50 && count($bought) + $batch < 250; $uid++) {
            if (isset($bought[$uid])) {
                continue;
            }
            if ($price($uid, $uid)['http'] === 200) {
                $batch++;
            }
        }
        if ($batch === 0 && count($bought) < 250) {
            break;
        }
    }
    $out['bought'] = count($bought);
    $out['buyFails'] = array_slice($buyFails, 0, 3);

    // —— The owner is sent every pile, and collects each ——
    $piles = $mine()['piles'] ?? [];
    $out['piles'] = count($piles);
    $out['pilesDistinct'] = count(array_unique(array_column($piles, 'op')));
    $out['pilesSum'] = array_sum(array_column($piles, 'price'));
    $out['pileBuyer'] = $piles[0]['buyer']['name'] ?? null;
    $before = $currantsOf(OWNER);
    $collected = 0;
    $paid = 0;
    foreach ($piles as $p) {
        $a = $collect($p['op']);
        if (($a['status'] ?? '') === 'collected') {
            $collected++;
            $paid += (int) $a['currants'];
        }
    }
    $out['collected'] = $collected;
    $out['paid'] = $paid;
    $out['ownerGained'] = $currantsOf(OWNER) - $before;
    $out['pilesAfter'] = count($mine()['piles'] ?? []);
} catch (Throwable $e) {
    $out['error'] = get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine();
} finally {
    $root->query("DROP DATABASE IF EXISTS `{$name}`");
    $out['dropped'] = $root->query("SHOW DATABASES LIKE '{$name}'")->num_rows === 0;
}
echo json_encode($out);
