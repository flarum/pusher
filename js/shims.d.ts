import * as PusherTypes from 'pusher-js';

declare module 'flarum/forum/ForumApplication' {
  export default interface ForumApplication {
    pusher: {
      channels: {
        main: PusherTypes.Channel;
        user: PusherTypes.Channel | null;
      };
      socket: PusherTypes.default;
    };

    pushedUpdates: any[];
  }
}
