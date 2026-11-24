<?php
/**
 * Runs the site repo's shared floor stacks (groddle-afternoon-site src/LedgerDrop.php) against a
 * throwaway MariaDB database and prints what happened as JSON (tests/floor-merge.test.js): on a house
 * floor a drop joins a like stack up to the class's stackmax, a part taken from a stack a merge grew
 * gets a new id (never answered "as recorded" from before the rise), who may join whom, and the
 * owner's floor-to-floor move with and without a merge. The database is made here
 * (test_groddle_merge_<hex>, from the site's minn.json declarations) and dropped at the end.
 *
 *   php tests/fixtures/drops/ledger-drop-merge.php <engine public/minn> <groddle-afternoon-site> run <host> <user> <pass>
 */

declare(strict_types=1);

[, $engine, $extension, $mode, $host, $user, $pass] = $argv;
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
use Groddle\Minn\Ledger;
use Groddle\Minn\LedgerDrop;
use Minn\Db;

const PREFIX = 'wp_';
const OWNER = 7;
const ADA = 9;
const BO = 11;
const HOUSE = 'HOUSE-7';
const STREET = 'LA5101HF7F429V';
const TOWER = 'TOWER-7-1';

function connect(string $host, string $user, string $pass, ?string $db = null): mysqli
{
    $m = new mysqli($host, $user, $pass, $db ?? '');
    $m->set_charset('utf8mb4');
    return $m;
}

$name = 'test_groddle_merge_' . bin2hex(random_bytes(4));
$root = connect($host, $user, $pass);
$root->query("CREATE DATABASE `{$name}`");
$out = ['db' => $name];
try {
    $conn = connect($host, $user, $pass, $name);
    $manifest = json_decode((string) file_get_contents($extension . '/minn.json'), true);
    foreach (['groddle_ledger', 'groddle_ledger_items', 'groddle_trades', 'groddle_ledger_log', 'groddle_mp_saves', 'groddle_drops', 'groddle_ledger_credited', 'groddle_ledger_outcomes'] as $t) {
        $conn->query('CREATE TABLE ' . PREFIX . $t . ' (' . implode(', ', $manifest['tables'][$t]) . ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    }
    $db = new Db($conn, PREFIX);
    $now = time();
    $saveOf = static fn (array $state): string => (string) json_encode(['kind' => 'groddle-multiplayer', 'format' => 1, 'entries' => ['playerState' => json_encode($state)]]);
    foreach ([OWNER => ['cherry' => 60, 'emblem_mab' => 8, 'teleportation_script' => 2, 'pick' => 2], ADA => ['apple' => 1], BO => ['cherry' => 5]] as $id => $inv) {
        $db->execute('INSERT INTO ' . $db->table('groddle_mp_saves') . ' (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)', [$id, $saveOf(['inventory' => $inv, 'player' => ['currants' => 0]]), gmdate('Y-m-d H:i:s')]);
    }
    $ledger = new Ledger($db, Economy::shared(), Ledger::RATE, Ledger::CAPACITY);
    $run = static fn (callable $fn) => Ledger::atomically($db, $fn);
    $run(function () use ($ledger, $now): void {
        foreach ([OWNER, ADA, BO] as $id) {
            $ledger->lock($id, $now);
        }
    });
    $cherries = static function () use ($ledger): array {
        $o = [];
        foreach ([OWNER, ADA, BO] as $id) {
            $o[$id] = (int) (((array) ($ledger->peek($id)['items'] ?? []))['cherry'] ?? 0);
        }
        return $o;
    };
    $row = static fn (string $op): ?array => $db->row('SELECT count, status, gen, merged_into, x, y, dropper_id FROM ' . $db->table(LedgerDrop::TABLE) . ' WHERE id = ?', [$op]);
    $trades = static fn (): int => (int) $db->value('SELECT COUNT(*) FROM ' . $db->table(Ledger::TRADES));
    $op = static fn (string $kind = 'drop'): string => $kind . '-' . bin2hex(random_bytes(8));
    $drop = static fn (array $d) => $run(fn () => LedgerDrop::settle($db, $ledger, $d + ['x' => 100, 'y' => 620, 'r' => null], $now));
    $give = static fn (string $id, int $who, ?int $n = null, ?int $from = null) => $run(fn () => LedgerDrop::give($db, $ledger, $id, $who, 'pickup', $now, $n, $from));
    $move = static fn (array $m) => $run(fn () => LedgerDrop::moveStack($db, $ledger, $m, $now));

    // —— A stack of 5 on the owner's house floor; Ada takes 2 of the 5 ——
    $a = $op();
    $out['a'] = $a;
    $drop(['op' => $a, 'id' => OWNER, 'street' => HOUSE, 'c' => 'cherry', 'n' => 5]);
    $out['firstPart'] = $give($a, ADA, 2, 5);

    // —— The owner drops 2 onto it: one stack of 5 again, in the drop's own transaction ——
    $b = $op();
    $out['b'] = $b;
    $call = LedgerDrop::call(['op' => $b, 'id' => OWNER, 'street' => HOUSE, 'x' => 102, 'y' => 620, 'item' => ['c' => 'cherry', 'n' => 2], 'into' => $a, 'max' => 10]);
    $out['call'] = $call;
    $out['merge'] = $run(fn () => LedgerDrop::settle($db, $ledger, $call, $now));
    $out['afterMerge'] = ['ledger' => $cherries(), 'a' => $row($a), 'b' => $row($b)];
    $before = $trades();
    $out['mergeRetry'] = $run(fn () => LedgerDrop::settle($db, $ledger, $call, $now));
    $out['afterMergeRetry'] = ['ledger' => $cherries(), 'a' => $row($a), 'newTrades' => $trades() - $before];

    // —— Ada takes 2 of the 5 again: the same count as before the merge, a new take ——
    $out['secondPart'] = $give($a, ADA, 2, 5);
    $out['afterSecond'] = ['ledger' => $cherries(), 'a' => $row($a)];
    $before = $trades();
    $out['secondRetry'] = $give($a, ADA, 2, 5);
    $out['afterSecondRetry'] = ['ledger' => $cherries(), 'a' => $row($a), 'newTrades' => $trades() - $before];

    // —— Stackmax: 9 onto the 3 (max 10) fills it to 10, 2 lie on their own; then a full stack takes none ——
    $c = $op();
    $out['cap'] = $drop(['op' => $c, 'id' => OWNER, 'street' => HOUSE, 'c' => 'cherry', 'n' => 9, 'into' => $a, 'max' => 10]);
    $out['afterCap'] = ['a' => $row($a), 'c' => $row($c)];
    $d = $op();
    $out['full'] = $drop(['op' => $d, 'id' => OWNER, 'street' => HOUSE, 'c' => 'cherry', 'n' => 1, 'into' => $a, 'max' => 10]);
    $out['afterFull'] = ['a' => $row($a), 'd' => $row($d)];

    // —— Who joins whom: only one player's own stacks (Austin 2026-11-24): a visitor's drop onto the owner's stack and the owner's onto a visitor's lie on their own ——
    $bo = $op();
    $drop(['op' => $bo, 'id' => BO, 'street' => HOUSE, 'c' => 'cherry', 'n' => 2]);
    $boOnOwner = $op();
    $out['visitorOnOwner'] = $drop(['op' => $boOnOwner, 'id' => BO, 'street' => HOUSE, 'c' => 'cherry', 'n' => 1, 'into' => $d, 'max' => 10]);
    $ownerOnBo = $op();
    $out['ownerOnVisitor'] = $drop(['op' => $ownerOnBo, 'id' => OWNER, 'street' => HOUSE, 'c' => 'cherry', 'n' => 1, 'into' => $bo, 'max' => 10]);
    $out['afterWho'] = ['d' => $row($d), 'bo' => $row($bo), 'ownerOnBo' => $row($ownerOnBo), 'boOnOwner' => $row($boOnOwner)];
    // A public street never merges here.
    $pub = $op();
    $drop(['op' => $pub, 'id' => OWNER, 'street' => STREET, 'c' => 'cherry', 'n' => 1]);
    $pub2 = $op();
    $out['publicStreet'] = $drop(['op' => $pub2, 'id' => OWNER, 'street' => STREET, 'c' => 'cherry', 'n' => 1, 'into' => $pub, 'max' => 10]);
    $out['afterPublic'] = ['pub' => $row($pub), 'pub2' => $row($pub2)];

    // —— The owner's floor-to-floor move: set down elsewhere, then onto a like stack ——
    $mv = $op('move');
    $out['move'] = $move(['op' => $mv, 'id' => OWNER, 'drop' => $c, 'street' => HOUSE, 'x' => 640, 'y' => 620]);
    $out['afterMove'] = $row($c);
    $out['moveRetry'] = $move(['op' => $mv, 'id' => OWNER, 'drop' => $c, 'street' => HOUSE, 'x' => 640, 'y' => 620]);
    $mv2 = $op('move');
    $out['moveMerge'] = $move(['op' => $mv2, 'id' => OWNER, 'drop' => $c, 'street' => HOUSE, 'x' => 100, 'y' => 620, 'into' => $d, 'max' => 10]);
    $out['afterMoveMerge'] = ['c' => $row($c), 'd' => $row($d)];
    $out['moveMergeRetry'] = $move(['op' => $mv2, 'id' => OWNER, 'drop' => $c, 'street' => HOUSE, 'x' => 100, 'y' => 620, 'into' => $d, 'max' => 10]);
    $out['visitorMove'] = $move(['op' => $op('move'), 'id' => ADA, 'drop' => $d, 'street' => HOUSE, 'x' => 1, 'y' => 620]);
    $out['moveCalls'] = [
        LedgerDrop::moveCall(['op' => $op('move'), 'id' => OWNER, 'drop' => $d, 'street' => STREET, 'x' => 1, 'y' => 2]),
        LedgerDrop::moveCall(['op' => $op(), 'id' => OWNER, 'drop' => $d, 'street' => HOUSE, 'x' => 1, 'y' => 2]),
        LedgerDrop::moveCall(['op' => $mv2, 'id' => OWNER, 'drop' => $d, 'street' => 'TOWER-7-2', 'x' => 1, 'y' => 2]) !== null,
    ];
    $out['trays'] = $db->rows('SELECT id, count, status FROM ' . $db->table(LedgerDrop::TABLE) . " WHERE status = 'ground' AND street = ?", [HOUSE]);

    // —— What the saves have not applied, and Ada's load ——
    $out['unappliedOwner'] = LedgerDrop::unapplied($db, OWNER, $now);
    $out['unappliedAda'] = LedgerDrop::unapplied($db, ADA, $now);
    $stored = json_decode((string) $db->value('SELECT data FROM ' . $db->table('groddle_mp_saves') . ' WHERE user_id = ?', [ADA]), true)['entries'];
    $caught = $run(fn () => $ledger->catchUp(ADA, $stored, $now));
    $state = json_decode($caught['entries']['playerState'], true);
    $out['caughtUp'] = ['cherry' => $state['inventory']['cherry'] ?? 0, 'applied' => $state['systems']['features']['trade']['applied'] ?? []];
    $out['ledger'] = $cherries();
    // —— Austin 2026-11-24 ("Let them pile up on floors"): on a Tower floor emblems (stackmax 1, told "max": 1)
    // join the owner's pile with no cap; a pile set down whole joins too; a Teleportation Script (words of its
    // own) and a Pick (wear) never join; a street still never merges ——
    $em = $op();
    $out['pile'] = ['first' => $drop(['op' => $em, 'id' => OWNER, 'street' => TOWER, 'c' => 'emblem_mab', 'n' => 1])];
    foreach ([1, 1, 3] as $i => $n) {
        $out['pile']['join' . $i] = $drop(['op' => $op(), 'id' => OWNER, 'street' => TOWER, 'c' => 'emblem_mab', 'n' => $n, 'into' => $em, 'max' => 1]);
    }
    $out['pile']['row'] = $row($em);
    $out['pile']['call'] = LedgerDrop::call(['op' => $op(), 'id' => OWNER, 'street' => TOWER, 'x' => 1, 'y' => 2, 'item' => ['c' => 'emblem_mab', 'n' => 1], 'into' => $em, 'max' => 1]);
    $ts = $op();
    $drop(['op' => $ts, 'id' => OWNER, 'street' => TOWER, 'c' => 'teleportation_script', 'n' => 1]);
    $out['pile']['script'] = $drop(['op' => $op(), 'id' => OWNER, 'street' => TOWER, 'c' => 'teleportation_script', 'n' => 1, 'into' => $ts, 'max' => 1]);
    $pk = $op();
    $drop(['op' => $pk, 'id' => OWNER, 'street' => TOWER, 'c' => 'pick', 'n' => 1]);
    $out['pile']['pick'] = $drop(['op' => $op(), 'id' => OWNER, 'street' => TOWER, 'c' => 'pick', 'n' => 1, 'into' => $pk, 'max' => 1]);
    $ep = $op();
    $drop(['op' => $ep, 'id' => OWNER, 'street' => STREET, 'c' => 'emblem_mab', 'n' => 1]);
    $out['pile']['street'] = $drop(['op' => $op(), 'id' => OWNER, 'street' => STREET, 'c' => 'emblem_mab', 'n' => 1, 'into' => $ep, 'max' => 1]);
    $out['pile']['caps'] = [LedgerDrop::pileCap('emblem_mab', 1), LedgerDrop::pileCap('gem_moonstone', 3), LedgerDrop::pileCap('teleportation_script', 1), LedgerDrop::pileCap('still', 1), LedgerDrop::pileCap('pick', 1)];
    // Ada takes 2 of the pile of 6, then the rest whole.
    $out['pile']['part'] = $give($em, ADA, 2, 6);
    $out['pile']['whole'] = $give($em, ADA);
    $out['pile']['adaEmblems'] = (int) (((array) ($ledger->peek(ADA)['items'] ?? []))['emblem_mab'] ?? 0);
    $out['pile']['ownerEmblems'] = (int) (((array) ($ledger->peek(OWNER)['items'] ?? []))['emblem_mab'] ?? 0);
} catch (Throwable $e) {
    $out['error'] = get_class($e) . ': ' . $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine();
} finally {
    $root->query("DROP DATABASE IF EXISTS `{$name}`");
    $out['dropped'] = $root->query("SHOW DATABASES LIKE '{$name}'")->num_rows === 0;
}
echo json_encode($out, JSON_UNESCAPED_SLASHES);
