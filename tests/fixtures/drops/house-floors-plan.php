<?php
/**
 * HouseFloors::plan (groddle-afternoon-site src/HouseFloors.php) on one save's entries, without the
 * database: what the house-floor move takes to the shared floor and what it keeps, as JSON.
 *
 *   php tests/fixtures/drops/house-floors-plan.php <groddle-afternoon-site> <owner> <entries JSON>
 */

declare(strict_types=1);

[, $site, $owner, $entries] = $argv;
spl_autoload_register(static function (string $class) use ($site): void {
    $prefix = 'Groddle\\Minn\\';
    if (str_starts_with($class, $prefix) && is_file($file = $site . '/src/' . substr($class, strlen($prefix)) . '.php')) {
        require $file;
    }
});
$plan = Groddle\Minn\HouseFloors::plan((array) json_decode($entries, true), (int) $owner);
$economy = Groddle\Minn\Economy::shared();
$own = [];
foreach ((array) json_decode((string) file_get_contents($site . '/data/economy.json'), true)['items'] as $c => $row) {
    if ($economy->own((string) $c) !== '') {
        $own[$c] = $economy->own((string) $c);
    }
}
echo json_encode(['moves' => $plan['moves'], 'kept' => (object) $plan['kept'], 'own' => (object) $own], JSON_UNESCAPED_SLASHES);
