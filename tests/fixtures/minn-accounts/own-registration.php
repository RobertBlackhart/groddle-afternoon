<?php
/**
 * Runs the site repo's src/OwnRegistration.php (groddle-afternoon-site, G1211) against the engine's
 * own hook table (Minn\Runtime\Runtime::hooks()) with a stand-in for Breakwater: a registration_errors
 * filter that, as Breakwater's Guard::evaluate does, asks breakwater_skip first and otherwise refuses
 * the registration with its "breakwater" error. A registration here is the last step of the engine's
 * AccountFlows::vetRegistration, the registration_errors filter that registerQuietly runs. Prints each
 * case's outcome as JSON (tests/g1211-own-registration.test.js). No database.
 *
 *   php tests/fixtures/minn-accounts/own-registration.php <engine public/minn> <groddle-afternoon-site>
 */

declare(strict_types=1);

[, $engine, $extension] = $argv;
define('ABSPATH', sys_get_temp_dir() . '/');
define('MINN_ENGINE_DIR', $engine);
require $engine . '/src/Minn/Autoloader.php';
Minn\Autoloader::register();
require $extension . '/src/OwnRegistration.php';

use Groddle\Minn\OwnRegistration;
use Minn\Runtime\Runtime;

$hooks = Runtime::hooks();

// The stand-in: Breakwater's Registration adapter (registration_errors at 99, 3 arguments) and Guard::evaluate's skip.
$asked = 0;
$breakwater = static function (ArrayObject $errors, string $name, string $email) use ($hooks, &$asked): ArrayObject {
    $asked++;
    if ($hooks->filter(OwnRegistration::SKIP, [false, (object) ['source' => 'registration', 'form' => 'single']]) !== true) {
        $errors['breakwater'] = 'We couldn\'t create your account right away because it was flagged for review.';
    }
    return $errors;
};
$hooks->add('registration_errors', $breakwater, 99, 3);

// One registration: the codes registration_errors leaves (none: the account is made).
$register = static fn (string $name = 'player-0a1b2c3d4e'): array => array_keys($hooks->filter('registration_errors', [new ArrayObject(), $name, 'player@example.com'])->getArrayCopy());

$out = [];
$out['plain'] = $register();
$out['own'] = OwnRegistration::run(static fn (): array => $register());
$out['skipLeftAfter'] = $hooks->has(OwnRegistration::SKIP);
$out['plainAfter'] = $register('someone-else');
$out['ownInside'] = OwnRegistration::run(static fn (): bool => $hooks->has(OwnRegistration::SKIP));

// A registration that throws still takes the skip off.
try {
    OwnRegistration::run(static function (): never {
        throw new RuntimeException('the database went away');
    });
} catch (RuntimeException $e) {
    $out['thrown'] = $e->getMessage();
}
$out['skipLeftAfterThrow'] = $hooks->has(OwnRegistration::SKIP);

// Another plugin's own breakwater_skip that says no (at the usual priority) doesn't undo the game's.
$hooks->add(OwnRegistration::SKIP, static fn (mixed $skip = false): bool => false, 10, 1);
$out['ownWithOtherFilter'] = OwnRegistration::run(static fn (): array => $register());
$out['plainWithOtherFilter'] = $register();
$out['asked'] = $asked;

echo json_encode($out, JSON_UNESCAPED_SLASHES);
