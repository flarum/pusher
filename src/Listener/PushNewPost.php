<?php

/*
 * This file is part of Flarum.
 *
 * For detailed copyright and license information, please view the
 * LICENSE file that was distributed with this source code.
 */

namespace Flarum\Pusher\Listener;

use Flarum\Post\Event\Posted;
use Flarum\User\Guest;
use Flarum\User\User;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Str;
use Pusher\ApiErrorException;
use Pusher\Pusher;
use Pusher\PusherException;

class PushNewPost
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
     * @throws PusherException
     * @throws ApiErrorException
     * @throws GuzzleException
     */
    public function handle(Posted $event)
    {
        $channels = [];

        if ($event->post->isVisibleTo(new Guest)) {
            $channels[] = 'public';
        } else {
            // Retrieve private channels, used for each user.
            $response = $this->pusher->getChannels([
                'filter_by_prefix' => 'private-user'
            ]);

            if (! $response) {
                return;
            }

            foreach ($response->channels as $name => $channel) {
                $userId = Str::after($name, 'private-user');

                if (($user = User::find($userId)) && $event->post->isVisibleTo($user)) {
                    $channels[] = $name;
                }
            }
        }

        if (count($channels)) {
            $tags = $event->post->discussion->tags;

            $this->pusher->trigger($channels, 'newPost', [
                'postId' => $event->post->id,
                'discussionId' => $event->post->discussion->id,
                'tagIds' => $tags ? $tags->pluck('id') : null
            ]);
        }
    }
}
