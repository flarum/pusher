<?php 
/*
 * This file is part of Flarum.
 *
 * (c) Toby Zerner <toby.zerner@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Flarum\Pusher\Api;

use Flarum\Api\Actions\Action;
use Flarum\Api\Request;
use Flarum\Core\Settings\SettingsRepository;
use Zend\Diactoros\Response\JsonResponse;
use Zend\Diactoros\Response\EmptyResponse;
use Pusher;

class AuthAction implements Action
{
    /**
     * @var SettingsRepository
     */
    protected $settings;

    /**
     * @var Pusher
     */
    protected $pusher;

    public function __construct(SettingsRepository $settings)
    {
        $this->settings = $settings;

        $this->pusher = new Pusher(
            $this->settings->get('pusher.app_key'),
            $this->settings->get('pusher.app_secret'),
            $this->settings->get('pusher.app_id')
        );
    }

    /**
     * Handles ajax authentication from pusher
     * @param Request $request
     * @return EmptyResponse|JsonResponse
     */
    public function handle(Request $request)
    {
        $authResponse = null;

        $privateChannels = ['private-user-' . $request->actor->id];
        $presenceChannels = ['presence-users'];

        if (in_array($request->get('channel_name'), $privateChannels)) {

            $authResponse = $this->pusher->socket_auth($request->get('channel_name'), $request->get('socket_id'));
        } elseif(in_array($request->get('channel_name'), $presenceChannels)) {
            $authResponse = $this->pusher->presence_auth($request->get('channel_name'), $request->get('socket_id'), $request->actor->username);
        }

        if($authResponse)
        {
            return new JsonResponse(json_decode($authResponse,true));
        }

        return new EmptyResponse(403);
    }
}
