<?php
/**
 * Runs the site repo's house-floor move (groddle-afternoon-site src/HouseFloors.php, with LedgerDrop,
 * Ledger, LedgerMath and the save it reads) against a throwaway MariaDB database and prints what
 * happened as JSON (tests/house-floors-migrate.test.js): a big house (116 stacks in the house and on
 * a Tower floor, of every kind) moved once, a second run, a window kept over the old copy, the save's
 * next write, a stack picked up and then a revert. The database is made here
 * (test_groddle_floors_<hex>, from the site's minn.json declarations) and dropped at the end.
 *
 *   php tests/fixtures/drops/house-floors.php <engine public/minn> <groddle-afternoon-site> run <host> <user> <pass>
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
const OWNER = 500;
const VISITOR = 9;

[, , , , $host, $user, $pass] = $argv;
$name = 'test_groddle_floors_' . bin2hex(random_bytes(4));
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
    $ledger = new Ledger($db, Economy::shared(), Ledger::RATE, Ledger::CAPACITY);
    $run = static fn (callable $fn) => Ledger::atomically($db, $fn);
    $now = time();
    $then = ($now - 86400 * 9) * 1000;

    // —— A big house, as one of the busiest live ones: 116 stacks in the house and on a Tower floor ——
    $house = [];
    $id = 1;
    $classes = ['apple', 'cherry', 'plank', 'paper', 'grain'];
    for ($i = 0; $i < 96; $i++) {
        $house[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_INT', 'classTsid' => $classes[$i % 5], 'count' => 1 + ($i % 7), 'x' => 800 + $i * 9, 'y' => 620, 'droppedAt' => $then + $i];
    }
    // On furniture (house_lock), a Decoration Mode floor placement, a note, a bag with things in it, tools that wear differently.
    for ($i = 0; $i < 8; $i++) {
        $house[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'apple', 'count' => 3, 'x' => 1000 + $i * 20, 'y' => 400, 'droppedAt' => $then, 'on' => 7];
    }
    $house[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'cherry', 'count' => 4, 'x' => 1500, 'y' => 620, 'droppedAt' => $now * 1000, 'decor' => true];
    $house[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'note', 'count' => 1, 'x' => 1510, 'y' => 620, 'droppedAt' => $then];
    $house[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'bag_bigger', 'count' => 1, 'x' => 1520, 'y' => 620, 'droppedAt' => $then, 'contents' => [['classTsid' => 'apple', 'count' => 2]]];
    $house[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'pick', 'count' => 2, 'x' => 1530, 'y' => 620, 'droppedAt' => $then, 'points' => [40, 90]];
    $house[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_INT', 'classTsid' => 'pick', 'count' => 1, 'x' => 1540, 'y' => 620, 'droppedAt' => $then, 'points' => [55]];
    $tower = [];
    for ($i = 0; $i < 3; $i++) {
        $tower[] = ['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_TOWER_2', 'classTsid' => 'plank', 'count' => 2, 'x' => 300 + $i * 30, 'y' => 620, 'droppedAt' => $then];
    }
    $street = [['id' => 'world-item-' . $id++, 'streetTsid' => 'RH_HOME_EXT', 'classTsid' => 'apple', 'count' => 9, 'x' => 100, 'y' => 620, 'droppedAt' => $then]];
    $dropped = ['version' => 1, 'nextId' => $id, 'streets' => ['RH_HOME_INT' => $house, 'RH_HOME_TOWER_2' => $tower, 'RH_HOME_EXT' => $street]];
    $state = ['inventory' => ['apple' => 2], 'player' => ['currants' => 0], 'systems' => ['home' => ['owned' => true], 'features' => ['homes' => ['houseX' => 750]]]];
    $entries = ['playerState' => (string) json_encode($state), 'droppedItems' => (string) json_encode($dropped)];
    $saveJson = static fn (array $e): string => (string) json_encode(['kind' => 'groddle-multiplayer', 'format' => 1, 'entries' => $e]);
    $db->execute('INSERT INTO ' . $db->table('groddle_mp_saves') . " (user_id, data, version, updated_at, writer, seq) VALUES (?, ?, 1, ?, 'pageAAAA1111', 3)", [OWNER, $saveJson($entries), gmdate('Y-m-d H:i:s')]);
    $db->execute('INSERT INTO ' . $db->table('groddle_mp_saves') . ' (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)', [VISITOR, $saveJson(['playerState' => (string) json_encode(['inventory' => [], 'player' => ['currants' => 0]])]), gmdate('Y-m-d H:i:s')]);
    $run(function () use ($ledger, $now): void {
        $ledger->lock(OWNER, $now);
        $ledger->lock(VISITOR, $now);
    });
    $stored = static fn (): array => json_decode((string) $db->value('SELECT data FROM ' . $db->table('groddle_mp_saves') . ' WHERE user_id = ?', [OWNER]), true);
    $ledgerItems = static fn (int $who = OWNER): array => (array) ($ledger->peek($who)['items'] ?? []);
    $holdings = static fn (array $e): array => LedgerMath::holdings($e, Economy::shared())['items'];
    $count = static fn (string $sql, array $a = []): int => (int) $db->value($sql, $a);
    $drops = $db->table(LedgerDrop::TABLE);
    $out['before'] = ['ledger' => $ledgerItems(), 'holdings' => $holdings($entries), 'rows' => 116];
    $out['plan'] = HouseFloors::plan($entries, OWNER);
    unset($out['plan']['dropped']);
    $out['plan']['moves'] = count($out['plan']['moves']);

    // —— The move (as the owner's load does it, or the one-off) ——
    $out['apply'] = HouseFloors::applyNow($db, $ledger, OWNER, $now);
    $after = $stored();
    $afterEntries = $after['entries'];
    $left = json_decode($afterEntries['droppedItems'], true)['streets'];
    $out['after'] = [
        'version' => $count('SELECT version FROM ' . $db->table('groddle_mp_saves') . ' WHERE user_id = ?', [OWNER]),
        'writer' => (string) $db->value('SELECT writer FROM ' . $db->table('groddle_mp_saves') . ' WHERE user_id = ?', [OWNER]),
        'left' => array_map(static fn (array $rows): int => count($rows), $left),
        'ground' => $count("SELECT COUNT(*) FROM {$drops} WHERE status = 'ground' AND dropper_id = ?", [OWNER]),
        'groundHouse' => $count("SELECT COUNT(*) FROM {$drops} WHERE street = 'HOUSE-500'"),
        'groundTower' => $count("SELECT COUNT(*) FROM {$drops} WHERE street = 'TOWER-500-2'"),
        'firstX' => $count("SELECT x FROM {$drops} WHERE street = 'HOUSE-500' ORDER BY created_at, id LIMIT 1"),
        'pickWear' => $db->value("SELECT points FROM {$drops} WHERE class_tsid = 'pick'"),
        'ledger' => $ledgerItems(),
        'holdings' => $holdings($afterEntries),
        'onGround' => array_reduce($db->rows("SELECT class_tsid, count FROM {$drops} WHERE status = 'ground'"), static function (array $c, array $r): array { $c[$r['class_tsid']] = ($c[$r['class_tsid']] ?? 0) + (int) $r['count']; return $c; }, []),
        'unapplied' => count(LedgerDrop::unapplied($db, OWNER, $now)),
        'pending' => count($ledger->pending(OWNER, LedgerMath::applied($afterEntries), $now)),
    ];

    // —— Again: nothing more moves ——
    $trades = static fn (): int => $count('SELECT COUNT(*) FROM ' . $db->table(Ledger::TRADES));
    $t0 = $trades();
    $out['again'] = HouseFloors::applyNow($db, $ledger, OWNER, $now + 5);
    $out['againLoad'] = $run(fn () => HouseFloors::onLoad($db, $ledger, OWNER, $entries, $now + 6))['changed'];
    $out['againTrades'] = $trades() - $t0;
    $out['againGround'] = $count("SELECT COUNT(*) FROM {$drops} WHERE dropper_id = ?", [OWNER]);

    // —— A window that loaded the old copy is kept over the moved one (takeover): the rows come off its floor, not its pack ——
    $kept = $run(fn () => $ledger->reapply(OWNER, $entries, $now - 60, $now + 10));
    $keptLeft = json_decode($kept['droppedItems'], true)['streets'];
    $out['takeover'] = ['left' => array_map(static fn (array $rows): int => count($rows), $keptLeft), 'pack' => json_decode($kept['playerState'], true)['inventory'], 'holdings' => $holdings($kept)];
    $write = $run(fn () => $ledger->write(OWNER, $kept, $now + 11));
    $out['takeoverWrite'] = $write['clamped'];
    // The owner's own next write of the moved copy: nothing to correct.
    $out['ownerWrite'] = $run(fn () => $ledger->write(OWNER, $afterEntries, $now + 12))['clamped'];

    // —— A visitor picks one up; then the move is put back ——
    $one = (string) $db->value("SELECT id FROM {$drops} WHERE street = 'HOUSE-500' AND class_tsid = 'apple' ORDER BY id LIMIT 1");
    $out['visitorTake'] = $run(fn () => LedgerDrop::give($db, $ledger, $one, VISITOR, 'pickup', $now + 20));
    $out['revert'] = HouseFloors::revert($db, $ledger, OWNER, $now + 30);
    $reverted = $stored()['entries'];
    $out['reverted'] = [
        'left' => array_map(static fn (array $rows): int => count($rows), json_decode($reverted['droppedItems'], true)['streets']),
        'ground' => $count("SELECT COUNT(*) FROM {$drops} WHERE status = 'ground'"),
        'ledger' => $ledgerItems(),
        'holdings' => $holdings($reverted),
        'visitor' => $ledgerItems(VISITOR),
        'write' => $run(fn () => $ledger->write(OWNER, $reverted, $now + 40))['clamped'],
    ];
    $out['revertAgain'] = HouseFloors::revert($db, $ledger, OWNER, $now + 50);
} catch (Throwable $e) {
    $out['error'] = get_class($e) . ': ' . $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine();
} finally {
    $root->query("DROP DATABASE IF EXISTS `{$name}`");
    $out['dropped'] = $root->query("SHOW DATABASES LIKE '{$name}'")->num_rows === 0;
}
echo json_encode($out, JSON_UNESCAPED_SLASHES);
