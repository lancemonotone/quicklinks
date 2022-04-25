/**
 * Entry point of app.
 */
"use strict";

import { Events } from '../../../../assets/js/src/modules/class.events.es6.js';
import { Tools } from './modules/class.tools.es6';
import { Cookies } from './modules/class.cookies.es6';
import { Elements } from './modules/class.elements.es6';
import { Links } from './modules/class.links.es6';
import { User } from './modules/class.user.es6';

!(
  function ( $ ) {
    // Block IE11-
    if (!!window.MSInputMethodContext && !!document.documentMode) {
      console.log('Quicklinks is not supported');
      return;
    }
    if(!document.getElementById('quicklinks-container')) {
      return;
    }

    //Touchpunch disables input form.
    $( 'input, li' ).on( 'click', function () {
      $( this ).focus();
    } );
    
    /**
     * These are the cookies the app will use.
     */
    const cookiesMap = {
      quicklinks: 'quicklinks',
      username: 'quicklinks_user',
      nohelp: 'quicklinks_nohelp',
      menu: 'quicklinks_toggled'
    };
    
    /**
     * @requires {$}
     * @requires {Elements}
     * @requires {Cookies}
     * @requires {User}
     * @requires {Tools}
     */
    function init() {
      // Add interface events.
      registerAsyncEvents();
      // Hook into ajax events.
      Elements.attachFrontElements();
      // Load cookies before user.
      Cookies.init( cookiesMap );
      
      User.init( {
        'quicklinks': Links.cookieObjectToLinks( Cookies.get( 'quicklinks' ) ),
        'username': Cookies.get( 'username' ),
        'linksChanged': !!Cookies.get( 'quicklinks' ),
        'status': Cookies.get( 'username' ) && !Cookies.get( 'quicklinks' ) ? 'restore' : 'init'
      } );
      
      Tools.init();
      
      Elements.addGaTracking();
    }
    
    /**
     * Central switchboard to handle async events.
     *
     * @todo Possible to replace with generators?
     * @requires {Events}
     */
    function registerAsyncEvents() {
      Events.on( 'afterInitUser', afterInitUser );
      Events.on( 'afterSaveUser', afterSaveUser );
      Events.on( 'updateUserLinks', updateUserLinks );
      Events.on( 'afterLoadLinks', afterLoadLinks );
      Events.on( 'afterShowOverlay', afterShowOverlay );
      Events.on( 'afterLoginFail', afterLoginFail );
      
      Events.on( 'edit', Elements.initLinkForm );
      Events.on( 'afterSortable', afterSortable );
      Events.on( 'prepend', Links.prepend );
      Events.on( 'save', Links.save );
      Events.on( 'remove', Links.remove );
      Events.on( 'insert', Links.insert );
      Events.on( 'swap', Links.swap );
    }
    
    const afterInitUser = links => {
      Links.init( links );
    };
    
    /**
     *
     */
    const updateUserLinks = ( links ) => {
      User.update( {
        'quicklinks': links,
        'status': 'save',
        'linksChanged': true
      } );
    };
    
    const afterSaveUser = () => {
      Elements.setStatus( User.getProperty( 'status' ), 'editorStatus' );
      setCookies();
    };
    
    const afterLoadLinks = index => {
      setCookies();
      Elements.initEditor( User.getUser() );
      Elements.initFront( User.getUser() );
      Elements.setLoginElements( User.getUser() );
      Elements.fadeBackground( index );
    };
    
    /**
     * Init editor interface.
     */
    const afterShowOverlay = () => {
      Elements.attachEditorElements();
      Links.loadAll();
    };
    
    const afterLoginFail = user => Elements.setLoginElements( user );
    
    /**
     * Handle droppable/sortable events.
     * @param obj
     */
    const afterSortable = obj => {
      switch ( obj.type ) {
        case 'swap':
          const index = obj.current;
          const original = obj.original;
          Events.emit( 'swap', { index, original } );
          break;
        case 'insert':
          insertLink( obj.item );
      }
    };
    
    const setCookies = () => {
      if ( User.getProperty( 'username' ) ) {
        Cookies.set( 'username', User.getProperty( 'username' ) );
      } else {
        Cookies.unset( 'username' );
      }
      if ( User.getProperty( 'linksChanged' ) ) {
        Cookies.set( 'quicklinks', Links.linksToCookieObject( User.getProperty( 'quicklinks' ) ) );
      } else {
        Cookies.unset( 'quicklinks' );
      }
    };
    
    /**
     * Add static link to user links at position.
     *
     * @requires {Link}
     * @param item
     */
    const insertLink = item => {
      const title = item.text();
      const url = item.find( 'a' )[ 0 ].href;
      const link = { title, url };
      const index = item.index();
      Events.emit( 'insert', { link, index } );
    };
    
    init();
  }
)( window.jQuery );