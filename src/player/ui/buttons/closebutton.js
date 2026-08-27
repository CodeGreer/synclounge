import shaka from 'shaka-player/dist/shaka-player.ui.debug';

export default (store) => {
  class CloseButton extends shaka.ui.Element {
    constructor(parent, controls) {
      super(parent, controls);

      // The actual button that will be displayed
      this.button = document.createElement('button');
      this.button.classList.add('shaka-close-button');
      this.button.classList.add('shaka-slplayer-button');
      this.button.classList.add('material-icons');
      this.button.textContent = 'close';
      this.parent.appendChild(this.button);

      // Stop the active playlist cleanly when this player is playing one.
      this.eventManager.listen(this.button, 'click', () => {
        const activePlaylistItem = store.getters['movienight/GET_ACTIVE_PLAYLIST_ITEM'];

        if (activePlaylistItem) {
          store.dispatch('movienight/STOP_PLAYLIST');
          return;
        }

        store.dispatch('slplayer/PRESS_STOP');
      });
    }
  }

  const factory = {
    create: (rootElement, controls) => new CloseButton(rootElement, controls),
  };

  shaka.ui.Controls.registerElement('close', factory);
};
