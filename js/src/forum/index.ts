import app from 'flarum/forum/app';
import Pusher from 'pusher-js';
import { extend } from 'flarum/common/extend';
import Application from 'flarum/common/Application';
import DiscussionList from 'flarum/forum/components/DiscussionList';
import DiscussionPage from 'flarum/forum/components/DiscussionPage';
import IndexPage from 'flarum/forum/components/IndexPage';
import Button from 'flarum/common/components/Button';
import ItemList from 'flarum/common/utils/ItemList';
import { VnodeDOM } from 'Mithril';

app.initializers.add('flarum-pusher', () => {
  extend(Application.prototype, 'mount', () => {
    const socket = new Pusher(app.forum.attribute('pusherKey'), {
      authEndpoint: `${app.forum.attribute('apiUrl')}/pusher/auth`,
      cluster: app.forum.attribute('pusherCluster'),
      auth: {
        headers: {
          'X-CSRF-Token': app.session.csrfToken,
        },
      },
    });

    app.pusher = {
      channels: {
        main: socket.subscribe('public'),
        user: app.session.user ? socket.subscribe(`private-user${app.session.user.id()}`) : null,
      },
      socket,
    };

    app.pushedUpdates = [];

    const channels = app.pusher.channels;
    if (channels.user) {
      channels.user.bind('notification', () => {
        app.session.user.pushAttributes({
          unreadNotificationCount: app.session.user.unreadNotificationCount() + 1,
          newNotificationCount: app.session.user.newNotificationCount() + 1,
        });
        app.notifications.clear();
        m.redraw();
      });
    }
  });

  extend(DiscussionList.prototype, 'oncreate', function () {
    app.pusher.socket.bind('newPost', (data: { tagIds: number[]; discussionId: number }) => {
      const params = app.discussions.getParams();

      if (!params.q && !params.sort && !params.filter) {
        if (params.tags) {
          const tag = app.store.getBy('tags', 'slug', params.tags);

          if (data.tagIds.indexOf(tag.id()) === -1) return;
        }

        const id = String(data.discussionId);

        if ((!app.current.get('discussion') || id !== app.current.get('discussion').id()) && app.pushedUpdates.indexOf(id) === -1) {
          app.pushedUpdates.push(id);

          if (app.current.matches(IndexPage)) {
            app.setTitleCount(app.pushedUpdates.length);
          }

          m.redraw();
        }
      }
    });
  });

  extend(DiscussionList.prototype, 'onremove', function () {
    app.pusher.socket.unbind('newPost');
  });

  extend(DiscussionList.prototype, 'view', function (vdom: VnodeDOM) {
    if (app.pushedUpdates) {
      const count = app.pushedUpdates.length;

      if (count) {
        vdom.children.unshift(
          Button.component(
            {
              className: 'Button Button--block DiscussionList-update',
              onclick: () => {
                this.attrs.state.refresh().then(() => {
                  this.loadingUpdated = false;
                  app.pushedUpdates = [];
                  app.setTitleCount(0);
                  m.redraw();
                });
                this.loadingUpdated = true;
              },
              loading: this.loadingUpdated,
            },
            app.translator.trans('flarum-pusher.forum.discussion_list.show_updates_text', { count })
          )
        );
      }
    }
  });

  extend(DiscussionPage.prototype, 'oncreate', function () {
    app.pusher.socket.bind('newPost', (data: { discussionId: number }) => {
      const id = String(data.discussionId);

      if (this.discussion && this.discussion.id() === id && this.stream) {
        const oldCount = this.discussion.commentCount();

        app.store.find('discussions', this.discussion.id()).then(() => {
          this.stream.update().then(m.redraw);

          if (!document.hasFocus()) {
            app.setTitleCount(Math.max(0, this.discussion.commentCount() - oldCount));

            window.addEventListener('focus', () => app.setTitleCount(0));
          }
        });
      }
    });
  });

  extend(DiscussionPage.prototype, 'onremove', function () {
    app.pusher.socket.unbind('newPost');
  });

  extend(IndexPage.prototype, 'actionItems', (items: ItemList) => {
    items.remove('refresh');
  });
});
