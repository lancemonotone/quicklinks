/**
 * @module Tools
 *
 * Handles interface events.
 * (Add Williams link, Add custom link/label, etc.)
 */
"use strict";

import { Cookies } from "./class.cookies.es6.js";
import { Elements } from "./class.elements.es6.js";
import { Events } from "../../../../../assets/js/src/modules/class.events.es6.js";
import { Links } from "./class.links.es6.js";
import { User } from "./class.user.es6.js";

/**
 * This function should be removed by RollupJS.
 * Q: Does it remove jsdoc comments too?
 * A: It does!
 */
export const dont_need_this = function () {
  return 42;
};

export const Tools = (function ( $ ) {
  const init = () => {
    registerEvents();
    doMenuDisplay( true );
  };

  /**
   * @requires window.jQuery
   */
  const registerEvents = () => {
    $( document ).on( 'click', '.quick-tool', e => {
      e.preventDefault();
      e.stopPropagation();
      doTool( $( e.target ) );
    } );
    //      $( document ).on( 'submit', '#quicklinks form', e => e.preventDefault() );
  };

  /**
   * Event handlers for <element class="quick-tool" data-tool="action"/>
   * @param $tool
   *
   * @requires {Cookies}
   */
  const doTool = ( $tool ) => {
    switch ( $tool.data( 'tool' ) ) {
      case 'add-current-page':
        addCurrentPage();
        break;
      case 'add-link':
        addLink( $tool );
        break;
      case 'add-custom':
        addCustom( $tool );
        break;
      case 'delete':
        deleteLink( $tool );
        break;
      case 'save-link':
        saveLink( $tool );
        break;
      case 'delete-cookies':
        Cookies.unsetAll();
        break;
      case 'dismiss':
        Elements.hideDismissibles();
        break;
      case 'dismiss-forms':
        dismissLinkForms( $tool );
        break;
      case 'edit-link':
        editLink( $tool );
        break;
      case 'login':
        doLogin( $tool );
        break;
      case 'logout':
        doLogout();
        break;
      case 'hide-menu':
        doMenuDisplay();
        break;
      case 'quick-launch':
        showOverlay();
        break;
      case 'restore-default-links':
        restoreDefaultLinks();
        break;
      case 'show':
        showDismissible( $tool );
        break;
      case 'show-cookies':
        Cookies.logAll();
        break;
    }
  };

  /**
   * Authenticate user via LDAP
   */
  const doLogin = $tool => {
    // Get form variables.
    const $form = $tool.parents( 'form' );
    $form.find( '.login-status' ).html( '' );
    // Show spinner
    $form.addClass( 'submitting' );

    const username = $form.find( 'input[name="username"]' ).val();
    const password = $form.find( 'input[name="password"]' ).val();
    const method = $form.find( "input:radio[name='method']:checked" ).val();
    //    const save = $form.find( 'input[name="save"]' ).is( ':checked' ) ? 'save' : 'init';

    if ( username && password ) {
      User.setProperties( { 'status': method } );
      const user = User.getUser();
      User.doLogin( { username, password, user } );
    } else {
      Elements.setStatus( 'Please enter both a user and a password', 'loginStatus', true );
      $form.removeClass( 'submitting' );
    }
  };

  const doLogout = () => User.init( {
    'status': 'You are now logged out.',
    'username': false
  } );

  const dismissLinkForms = () => Elements.closeAllLinkForms();

  /**
   * Show Dismissible
   */
  const showDismissible = $tool => {
    Elements.hideDismissibles();
    Elements.showDismissible( $( $tool.data( 'target' ) ) );
  };

  const deleteCookies = () => {
    if ( confirm( 'All cookies will be deleted. Continue?' ) ) {
      Cookies.unsetAll();
      User.update( {
        'quicklinks': false,
        'username': false,
        'linksChanged': false
      } );
    }
  };

  const restoreDefaultLinks = () => {
    if ( confirm( 'All customized links will be deleted. Continue?' ) ) {
      User.init( {
        'quicklinks': false,
        'linksChanged': false,
        'status': 'restore'
      } );
    }
  };

  /**
   * Retrieve link title and url.
   * @param $tool
   * @returns {{$linkElement, url, title}}
   */
  const getLinkData = $tool => {
    const $linkElement = $tool.parents( 'li.quick-item' );
    const title = $linkElement.find( '.title' ).text();
    let url;
    if ( !$linkElement.hasClass( 'quick-cat' ) ) {
      url = $linkElement.find( '.bt-external-link' )[0].href;
    }
    const link = { title, url };
    return { $linkElement, link };
  };

  function getFormData( $tool ) {
    let link;
    const $form = $tool.parents( 'form' );
    const title = $form.find( '[name="custom-item-title"]' ).val();
    switch ( $form.find( '[name="custom-form"]' ).val() ) {
      case 'link':
        const url = $form.find( '[name="custom-item-url"]' ).val();
        link = validateForm( title, url );
        break;
      case 'divider':
        link = validateForm( title );
    }
    if ( link ) {
      $form[0].reset();
      return link;
    }
    return false;
  }

  /**
   * Check for existence of title, and correctly-formed url if this is a link.
   * @param title
   * @param url
   * @return {boolean}
   */
  const validateForm = ( title, url = null ) => {
    if ( title === '' ) {
      title = prompt( 'Please enter a title' );
      if ( !title ) {
        return false;
      }
    }
    if ( url !== null ) {
      if ( url === '' ) {
        url = prompt( 'Please enter a URL' );
        if ( !url ) {
          return false;
        }
      }
      if ( url && url.indexOf( "://" ) === -1 ) {
        // format url if they didn't
        url = 'http://' + url;
      }
    }

    url = encodeURI( url );

    return { title, url };
  };
  /**
   * Bookmark.
   *
   * @requires {Links}
   */
  const addCurrentPage = () => {
    const title = document.title;
    const url = window.location.href;
    Events.emit( 'prepend', { title, url } )
  };
  /**
   * @requires {Events}
   * @param $tool
   */
  const saveLink = $tool => {
    const link = getFormData( $tool );
    const index = $tool.parents( 'li' ).index();
    Events.emit( 'save', { link, index } );
  };
  /**
   * Populate link edit form.
   * @requires {Events}
   * @param $tool
   */
  const editLink = $tool => Events.emit( 'edit', getLinkData( $tool ) );
  /**
   * Process custom link and divider submissions.
   * @requires {Events}
   * @param $tool
   */
  const addCustom = $tool => Events.emit( 'prepend', getFormData( $tool ) );
  /**
   * Add Williams link using + button.
   * @requires {Events}
   * @param $tool
   */
  const addLink = $tool => {
    const { link } = getLinkData( $tool );
    Events.emit( 'prepend', link );
  };
  /**
   * @requires {Links}
   * @param $tool
   */
  const deleteLink = $tool => {
    const $item = $tool.parents( '.quick-item' ).hide();
    const index = $item.index();
    Events.emit( 'remove', index );
  };
  /**
   * Hide or show mega menu links.
   *
   * @param isInit
   *
   * @requires window.jQuery
   * @requires {Elements}
   * @requires {Cookies}
   */
  const doMenuDisplay = isInit => {
    let menuToggled = Cookies.get( 'menu' ) === 'true';

    if ( !isInit ) {
      if ( !menuToggled ) {
        menuToggled = true;
        Cookies.set( 'menu', 'true' );
      } else {
        menuToggled = false;
        Cookies.unset( 'menu' );
      }
      $( 'html, body' ).animate( {
        scrollTop: $( 'body' ).offset().top
      }, 500 );
    }

    Elements.toggleMenu( menuToggled );
  };
  /**
   * Show QL editing interface in lightbox overlay
   *
   * @requires window.jQuery
   * @requires {Events}
   * @requires {Elements}
   */
  const showOverlay = () => {
    $.featherlight( myAjax.siteurl + '/ql/?iframe', {
      afterContent: function () {
        const $self = this;
        const $instance = $self.$instance.find( '.' + $self.namespace + '-content' );
        // set our custom close icon
        $instance.find( '.featherlight-close' ).html( '<span class="bts bt-times"></span>' );

        // init and load editor interface and links
        Events.emit( 'afterShowOverlay' );
      },
      afterOpen: function () {
        // isIos() is in featherlight-config
        if ( !isIos() ) {
          $( 'html' ).css( 'overflow', 'hidden' );
        }
      },
      afterClose: function () {
        if ( !isIos() ) {
          $( 'html' ).css( 'overflow', 'auto' );
        }
      }
    } );
  };

  return {
    init: init,
    registerEvents: registerEvents,
    doTool: doTool,
    deleteCookies: deleteCookies,
    restoreDefaultLinks: restoreDefaultLinks,
    addCurrentPage: addCurrentPage,
    addLink: addLink,
    editLink: editLink,
    validateForm: validateForm,
    deleteLink: deleteLink,
    doMenuDisplay: doMenuDisplay,
    showOverlay: showOverlay
  }
})( window.jQuery );