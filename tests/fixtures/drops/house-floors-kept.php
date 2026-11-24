<?php
/**
 * Report #670: the house-floor move (groddle-afternoon-site src/HouseFloors.php, v0.63.0) took Stills
 * out of their owners' saves onto the shared floor, where they cannot work. This runs the one-time
 * return (HouseFloors::returnKept, bin/house-floors.php return-kept) against a throwaway MariaDB
 * database and prints what happened as JSON (tests/r670-still-house-floors.test.js):
 *
 *   - 500: a Still in the back yard with its hopper and Hooch, moved with apples and a Teleportation
 *     Script; a Cherry dropped in the save since. The Still goes back, the rest stays as it is.
 *   - 501: the owner picked the moved Still up since: skipped.
 *   - 502: the owner has since set another Still at that spot in the save: skipped.
 *
 * The moves are made as v0.63.0 made them (the economy table without "own"), then the dry run, the
 * return, a second run, a window kept over the old copy (Ledger::reapply) and the next writes. The
 * database is made here (test_groddle_kept_<hex>, from the site's minn.json declarations) and dropped
 * at the end.
 *
 *   php tests/fixtures/drops/house-floors-kept.php <engine public/minn> <groddle-afternoon-site> run <host> <user> <pass>
 */

declare(strict_types=1);

[, $engine, $extension, $mode] = $argv;
define('ABSPATH', sys_get_temp_dir() . '/');
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

use Groddle\Minn\Economy;
use Groddle\Minn\HouseFloors;
use Groddle\Minn\Ledger;
use Groddle\Minn\LedgerDrop;
use Groddle\Minn\LedgerMath;
use Minn\Db;

const PREFIX = 'wp_';
const USERS = [500, 501, 502];

[, , , , $host, $user, $pass] = $argv;
$name = 'test_groddle_kept_' . bin2hex(random_bytes(4));
$root = new mysqli($host, $user, $pass);
$root->query("CREATE DATABASE `{$name}`");
$out = ['db' => $name];
try {
    $conn = new mysqli($host, $user, $pass, $name);
    $conn->set_charset('utf8mb4');
    $manifest = json_decode((string) file_get_contents($extension . '/minn.json'), true);
    foreach (['groddle_ledger', 'groddle_ledger_items', 'groddle_trades', 'groddle_ledger_log', 'groddle_mp_saves', 'groddle_drops', 'groddle_ledger_credited', 'groddle_ledger_outcomes', 'groddle_house_floors'] as $t) {
        $conn->query('CREATE TABLE ' . PREFIX . $t . ' (' . implode(', ', $manifest['tables'][$t]) . ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }
    $db = new Db($conn, PREFIX);
    $economy = Economy::shared();
    $ledger = new Ledger($db, $economy, Ledger::RATE, Ledger::CAPACITY);
    $run = static fn (callable $fn) => Ledger::atomically($db, $fn);
    $now = time();
    $then = ($now - 86400 * 9) * 1000;
    $saves = $db->table('groddle_mp_saves');
    $drops = $db->table(LedgerDrop::TABLE);
    $count = static fn (string $sql, array $a = []): int => (int) $db->value($sql, $a);
    $saveJson = static fn (array $e): string => (string) json_encode(['kind' => 'groddle-multiplayer', 'format' => 1, 'entries' => $e]);
    $stored = static fn (int $u): array => json_decode((string) $db->value("SELECT data FROM {$saves} WHERE user_id = ?", [$u]), true)['entries'];
    $floor = static fn (array $e, string $place = 'RH_HOME_INT'): array => json_decode($e['droppedItems'], true)['streets'][$place] ?? [];
    $holdings = static fn (array $e): array => LedgerMath::holdings($e, $economy)['items'];
    $ledgerItems = static fn (int $u): array => (array) ($ledger->peek($u)['items'] ?? []);

    // —— Three houses, each with a Still in the back yard (x left of the house at 1650) ——
    $hopper = ['hopper' => 13, 'hooch' => 39, 'workingSince' => 0, 'ready' => true];
    $script = ['tsid' => 'LA5101HF7F429V', 'x' => 120, 'y' => -80, 'label' => 'Groddle Meadow', 'hubId' => '27', 'hubName' => 'Groddle Meadow', 'imbued' => false];
    $origin = [];
    foreach (USERS as $u) {
        $rows = [
            ['id' => 'world-item-45', 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'still', 'count' => 1, 'x' => 418, 'y' => 680, 'droppedAt' => $then, 'points' => [0], 'tags' => [$hopper]],
            ['id' => 'world-item-46', 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'apple', 'count' => 3, 'x' => 1800, 'y' => 620, 'droppedAt' => $then],
            ['id' => 'world-item-47', 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'teleportation_script', 'count' => 1, 'x' => 1850, 'y' => 620, 'droppedAt' => $then, 'tags' => [$script]],
        ];
        $pack = ['apple' => 2] + ($u === 500 ? ['cherry' => 2] : []) + ($u === 502 ? ['still' => 1] : []);
        $state = ['inventory' => $pack, 'player' => ['currants' => 0], 'systems' => ['home' => ['owned' => true], 'features' => ['homes' => ['houseX' => 1650]]]];
        $origin[$u] = ['playerState' => (string) json_encode($state), 'droppedItems' => (string) json_encode(['version' => 1, 'nextId' => 48, 'streets' => ['RH_HOME_INT' => $rows]])];
        $db->execute("INSERT INTO {$saves} (user_id, data, version, updated_at, writer, seq) VALUES (?, ?, 1, ?, 'pageAAAA1111', 3)", [$u, $saveJson($origin[$u]), gmdate('Y-m-d H:i:s')]);
        $run(fn () => $ledger->lock($u, $now - 86400));
    }

    // —— The move as v0.63.0 made it: nothing kept a Still (HouseFloors::onLoad with that table) ——
    $table = json_decode((string) file_get_contents($extension . '/data/economy.json'), true);
    foreach ($table['items'] as $c => $row) {
        unset($table['items'][$c]['own']);
    }
    $old = new Economy($table);
    $out['newRule'] = HouseFloors::plan($origin[500], 500)['kept'];
    foreach (USERS as $u) {
        $run(function () use ($db, $ledger, $u, $origin, $old, $now, $saves, $saveJson): void {
            $plan = HouseFloors::plan($origin[$u], $u, $old);
            $moved = [];
            foreach ($plan['moves'] as $m) {
                if (LedgerDrop::fromFloor($db, $ledger, $m, $u, $now - 3600)) {
                    $moved[] = $m;
                }
            }
            $db->execute('INSERT INTO ' . $db->table(HouseFloors::TABLE) . ' (user_id, moved_at, backup, moved, reverted_at) VALUES (?, ?, ?, ?, NULL)', [
                $u, gmdate('Y-m-d H:i:s', $now - 3600), $origin[$u]['droppedItems'], (string) json_encode(['moves' => $moved, 'kept' => $plan['kept'], 'short' => 0], JSON_UNESCAPED_SLASHES),
            ]);
            $e = $origin[$u];
            $e['droppedItems'] = HouseFloors::without($e['droppedItems'], array_map(static fn (array $m): array => [$m['place'], $m['row']], $moved));
            $db->execute("UPDATE {$saves} SET data = ?, version = 2, writer = '' WHERE user_id = ?", [$saveJson($e), $u]);
        });
    }
    $stillOp = static fn (int $u): string => (string) $db->value("SELECT id FROM {$drops} WHERE dropper_id = ? AND class_tsid = 'still'", [$u]);
    $out['moved'] = [
        'ground' => $count("SELECT COUNT(*) FROM {$drops} WHERE status = 'ground'"),
        'stillWords' => json_decode((string) $db->value("SELECT tag FROM {$drops} WHERE id = ?", [$stillOp(500)]), true),
        'scriptWords' => json_decode((string) $db->value("SELECT tag FROM {$drops} WHERE dropper_id = 500 AND class_tsid = 'teleportation_script'"), true),
        'stillWear' => $db->value("SELECT points FROM {$drops} WHERE id = ?", [$stillOp(500)]),
        'floor500' => count($floor($stored(500))),
    ];

    // —— Since then: 500 dropped a Cherry in the house; 501 picked the Still up; 502 set another Still at that spot ——
    $e = $stored(500);
    $d = json_decode($e['droppedItems'], true);
    $d['streets']['RH_HOME_INT'][] = ['id' => 'world-item-48', 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'cherry', 'count' => 2, 'x' => 900, 'y' => 620, 'droppedAt' => $now * 1000];
    $d['nextId'] = 49;
    $e['droppedItems'] = (string) json_encode($d);
    $ps = json_decode($e['playerState'], true);
    $ps['inventory']['cherry'] = 0;
    $e['playerState'] = (string) json_encode($ps);
    $db->execute("UPDATE {$saves} SET data = ? WHERE user_id = 500", [$saveJson($e)]);
    $out['write500'] = $run(fn () => $ledger->write(500, $e, $now - 60))['clamped'];
    $out['take501'] = $run(fn () => LedgerDrop::give($db, $ledger, $stillOp(501), 501, 'pickup', $now - 1800))['status'];
    $e = $stored(502);
    $d = json_decode($e['droppedItems'], true);
    $d['streets']['RH_HOME_INT'][] = ['id' => 'world-item-48', 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'still', 'count' => 1, 'x' => 425, 'y' => 680, 'droppedAt' => $now * 1000];
    $e['droppedItems'] = (string) json_encode($d);
    $ps = json_decode($e['playerState'], true);
    $ps['inventory']['still'] = 0;
    $e['playerState'] = (string) json_encode($ps);
    $db->execute("UPDATE {$saves} SET data = ? WHERE user_id = 502", [$saveJson($e)]);
    $out['write502'] = $run(fn () => $ledger->write(502, $e, $now - 60))['clamped'];

    $before = ['500' => $stored(500), 'ledger500' => $ledgerItems(500), 'version500' => $count("SELECT version FROM {$saves} WHERE user_id = 500")];
    $trades = static fn (): int => $count('SELECT COUNT(*) FROM ' . $db->table(Ledger::TRADES));

    // —— The dry run: counts only, nothing written ——
    $t0 = $trades();
    $out['dry'] = array_map(static fn (int $u) => HouseFloors::returnKept($db, $ledger, $u, $now, false), USERS);
    $out['dryWrote'] = $trades() - $t0 + ($stored(500) === $before['500'] ? 0 : 1) + $count("SELECT COUNT(*) FROM {$drops} WHERE status = 'reverted'");

    // —— The return ——
    $out['run'] = array_map(static fn (int $u) => HouseFloors::returnKept($db, $ledger, $u, $now, true), USERS);
    $after = $stored(500);
    $rows = $floor($after);
    $still = array_values(array_filter($rows, static fn (array $r): bool => $r['classTsid'] === 'still'));
    $out['after'] = [
        'floor' => array_map(static fn (array $r): string => $r['id'] . ':' . $r['classTsid'], $rows),
        'still' => $still[0] ?? null,
        'stillStatus' => $db->row("SELECT status, why FROM {$drops} WHERE id = ?", [$stillOp(500)]),
        'shared500' => array_column($db->rows("SELECT class_tsid FROM {$drops} WHERE dropper_id = 500 AND status = 'ground' ORDER BY class_tsid"), 'class_tsid'),
        'pack' => json_decode($after['playerState'], true)['inventory'],
        'version' => $count("SELECT version FROM {$saves} WHERE user_id = 500") - $before['version500'],
        'writer' => (string) $db->value("SELECT writer FROM {$saves} WHERE user_id = 500"),
        'ledgerStill' => $ledgerItems(500)['still'] ?? 0,
        'ledgerMatches' => $holdings($after) == $ledgerItems(500),
        'write' => $run(fn () => $ledger->write(500, $after, $now + 10))['clamped'],
        'still501' => $db->row("SELECT status, why FROM {$drops} WHERE id = ?", [$stillOp(501)]),
        'still502' => $db->row("SELECT status, why FROM {$drops} WHERE id = ?", [$stillOp(502)]),
        'floor502' => count(array_filter($floor($stored(502)), static fn (array $r): bool => $r['classTsid'] === 'still')),
    ];

    // —— Again: nothing changes ——
    $t0 = $trades();
    $v0 = $count("SELECT SUM(version) FROM {$saves}");
    $out['again'] = array_map(static fn (int $u) => HouseFloors::returnKept($db, $ledger, $u, $now + 20, true), USERS);
    $out['againWrote'] = ($trades() - $t0) + ($count("SELECT SUM(version) FROM {$saves}") - $v0);

    // —— A window that loaded the copy from before the move is kept over it (takeover) ——
    $kept = $run(fn () => $ledger->reapply(500, $origin[500], $now - 7200, $now + 30));
    $keptRows = $floor($kept);
    $out['takeover'] = [
        'floor' => array_map(static fn (array $r): string => $r['id'] . ':' . $r['classTsid'], $keptRows),
        'still' => array_values(array_filter($keptRows, static fn (array $r): bool => $r['classTsid'] === 'still'))[0]['tags'] ?? null,
        'pack' => json_decode($kept['playerState'], true)['inventory'],
        'write' => $run(fn () => $ledger->write(500, $kept, $now + 40))['clamped'],
    ];
} catch (Throwable $e) {
    $out['error'] = get_class($e) . ': ' . $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine();
} finally {
    $root->query("DROP DATABASE IF EXISTS `{$name}`");
    $out['dropped'] = $root->query("SHOW DATABASES LIKE '{$name}'")->num_rows === 0;
}
echo json_encode($out, JSON_UNESCAPED_SLASHES);
