<?php
// tests/g895-ledger-refund.test.js and g905-ledger-refund.test.js: run the site's LedgerRefund::run against an in-memory stand-in for
// Minn's Db (only the statements the refund sends), so its dry run and its apply are checked without a
// database. Reads {site, log: [{id, user_id, at, kind, detail}], names: {id: name}, credited: [[user, kind, ref, n, at?]],
// calls: [{apply, ref, since?, users?}]} on stdin; prints each call's result and what the tables hold after.
declare(strict_types=1);

namespace Minn {
    final class Db
    {
        public array $log = [];
        public array $names = [];
        public array $credited = [];
        public array $mail = [];
        public function table(string $n): string { return $n; }
        public function transaction(callable $work): mixed { return $work(); }
        public function rows(string $sql, array $p = []): array
        {
            if (str_starts_with($sql, 'SELECT id, user_id, at, kind, detail FROM groddle_ledger_log WHERE ')) {
                $g895 = str_contains($sql, "kind = 'clamp' AND at >= ?");
                $since = $g895 ? array_shift($p) : null;
                $users = str_contains($sql, 'user_id IN') ? array_map('intval', $p) : null;
                $out = array_values(array_filter($this->log, static function (array $r) use ($g895, $since, $users): bool {
                    if ($users !== null && !in_array((int) $r['user_id'], $users, true)) {
                        return false;
                    }
                    return $g895 ? $r['kind'] === 'clamp' && $r['at'] >= $since : ($r['kind'] === 'clamp' || ($r['kind'] === 'credit' && str_contains($r['detail'], '"later"')));
                }));
                usort($out, static fn ($a, $b) => [$a['user_id'], $a['at'], $a['id']] <=> [$b['user_id'], $b['at'], $b['id']]);
                return $out;
            }
            // G905: when G895's refunds were applied ([user, kind, ref, n, at?] rows).
            if ($sql === 'SELECT user_id, ref, at FROM groddle_ledger_credited WHERE kind = ? AND ref IN (?, ?)') {
                $out = [];
                foreach ($this->credited as $row) {
                    if ($row[1] === $p[0] && in_array($row[2], [$p[1], $p[2]], true)) {
                        $out[] = ['user_id' => $row[0], 'ref' => $row[2], 'at' => $row[4] ?? '2026-11-16 00:00:00'];
                    }
                }
                return $out;
            }
            if (str_contains($sql, 'FROM users u LEFT JOIN groddle_players')) {
                $out = [];
                foreach ($p[0] as $id) {
                    $out[] = ['ID' => $id, 'user_login' => "user{$id}", 'display_name' => '', 'name' => $this->names[$id] ?? ''];
                }
                return $out;
            }
            throw new \LogicException("rows: {$sql}");
        }
        public function value(string $sql, array $p = []): int|string|null
        {
            if (str_starts_with($sql, 'SELECT n FROM groddle_ledger_credited WHERE user_id = ? AND kind = ? AND ref = ?')) {
                foreach ($this->credited as [$u, $k, $r, $n]) {
                    if ($u === $p[0] && $k === $p[1] && $r === $p[2]) {
                        return $n;
                    }
                }
                return null;
            }
            throw new \LogicException("value: {$sql}");
        }
        public function execute(string $sql, array $p = []): int
        {
            if (str_starts_with($sql, 'INSERT INTO groddle_player_mail ')) {
                $this->mail[] = ['to' => $p[1], 'text' => $p[3], 'class' => $p[4], 'count' => $p[5], 'currants' => $p[6]];
                return 1;
            }
            if (str_starts_with($sql, 'INSERT INTO groddle_ledger_credited ')) {
                $this->credited[] = [$p[0], $p[1], $p[2], $p[3]];
                return 1;
            }
            if (str_starts_with($sql, 'INSERT INTO groddle_ledger_log ')) {
                $this->log[] = ['id' => count($this->log) + 100000, 'user_id' => $p[0], 'at' => $p[1], 'kind' => $p[2], 'detail' => $p[3]];
                return 1;
            }
            throw new \LogicException("execute: {$sql}");
        }
    }
}

namespace {
    $in = json_decode(stream_get_contents(STDIN), true);
    foreach (['Economy', 'LedgerMath', 'Ledger', 'LedgerMail', 'Characters', 'LedgerRefund'] as $c) {
        require $in['site'] . "/src/{$c}.php";
    }
    $db = new Minn\Db();
    $db->log = $in['log'];
    $db->names = array_combine(array_map('intval', array_keys($in['names'])), array_values($in['names']));
    $db->credited = $in['credited'];
    $out = [];
    foreach ($in['calls'] as $call) {
        $out[] = Groddle\Minn\LedgerRefund::run($db, Groddle\Minn\Economy::shared(), (bool) $call['apply'], $call['users'] ?? null, 1763400000, '', $call['ref'], $call['since'] ?? null);
    }
    echo json_encode(['results' => $out, 'mail' => $db->mail, 'credited' => $db->credited, 'refundRows' => array_values(array_filter($db->log, static fn ($r) => $r['kind'] === 'refund'))]);
}
