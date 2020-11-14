import app from 'flarum/app';

app.initializers.add('flarum-pusher', app => {
  app.extensionData.for('flarum-pusher')
    .registerSettings([
      {
        setting: 'flarum-pusher.app_id',
        label: app.translator.trans('flarum-pusher.admin.pusher_settings.app_id_label'),
        type: 'text'
      },
      {
        setting: 'flarum-pusher.app_key',
        label: app.translator.trans('flarum-pusher.admin.pusher_settings.app_key_label'),
        type: 'text'
      },
      {
        setting: 'flarum-pusher.app_secret',
        label: app.translator.trans('flarum-pusher.admin.pusher_settings.app_secret_label'),
        type: 'text'
      },
      {
        setting: 'flarum-pusher.app_cluster',
        label: app.translator.trans('flarum-pusher.admin.pusher_settings.app_cluster_label'),
        type: 'text'
      }
    ])
});
