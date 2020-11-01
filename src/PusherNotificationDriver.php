<?php

/*
 * This file is part of Flarum.
 *
 * For detailed copyright and license information, please view the
 * LICENSE file that was distributed with this source code.
 */

namespace Flarum\Pusher;

use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\Driver\NotificationDriverInterface;
use Pusher;

class PusherNotificationDriver implements NotificationDriverInterface
{
    /**
     * @var Pusher
     */
    protected $pusher;

    public function __construct(Pusher $pusher)
    {
        $this->pusher = $pusher;
    }

    /**
     * {@inheritDoc}
     */
    public function send(BlueprintInterface $blueprint, array $users): void
    {
        foreach ($users as $user) {
            if ($user->shouldAlert($blueprint::getType())) {
                $this->pusher->trigger('private-user'.$user->id, 'notification', null);
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    public function addUserPreference(string $blueprintClass, bool $default): void
    {
        // ...
    }
}
