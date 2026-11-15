<?php
/**
 * G795: the site's word on a Tower's floor under construction (groddle-afternoon-site
 * src/HomeStreet.php tower), printed as JSON for tests/g795-tower-floor-together.test.js. Pure.
 *
 *   php tests/fixtures/minn-accounts/home-tower.php <engine public/minn> <groddle-afternoon-site>
 */

declare(strict_types=1);

[, $engine, $extension] = $argv;
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

use Groddle\Minn\HomeStreet;

$t = static fn (array $v): object => json_decode((string) json_encode($v));
echo json_encode([
    'building' => HomeStreet::tower(7, $t(['built' => true, 'floors' => 2, 'expanding' => true, 'expansion' => ['r1706' => 5, 'r1707' => '12', 'bad key' => 3, 'r1708' => 0, 'r1709' => -4]])),
    'big' => HomeStreet::tower(1000, $t(['built' => true, 'floors' => 8, 'expanding' => true])),
    'notExpanding' => HomeStreet::tower(7, $t(['built' => true, 'floors' => 3, 'expanding' => false])),
    'notBuilt' => HomeStreet::tower(7, $t(['built' => false, 'floors' => 2, 'expanding' => true])),
    'tallest' => HomeStreet::tower(7, $t(['built' => true, 'floors' => 9, 'expanding' => true])),
    'noOwner' => HomeStreet::tower(0, $t(['built' => true, 'floors' => 2, 'expanding' => true])),
    'none' => HomeStreet::tower(7, null),
], JSON_UNESCAPED_SLASHES);
