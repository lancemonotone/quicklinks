/**
 * @module Elements Object
 */
"use strict";
import { Common } from '../../../../../assets/js/src/common.es6';
import { Events } from '../../../../../assets/js/src/modules/class.events.es6.js';
import '../../../../../assets/js/src/expando_tabs.es6';

export const Elements = (function ( $ ) {
    const front = {
      // Mega menu
      menu: null,
      // Inside QL section of public menu
      container: null,
      // User's default or cookie-saved links
      userLinks: null,
      // Action buttons
      quickActions: null,
      // User logged-in icon
      userIcon: null,
      // Edit button
      quickLaunch: null
    };
    const editor = {
      // Inside editor in lightbox overlay
      container: null,
      // Status messages
      status: null,
      // Initialize static-links filter
      filterInput: null,
      // Container for Help and Login form.
      utilityContainer: null,
      // Info content for new users.
      helpContainer: null,
      // User's default or cookie-saved links
      userLinks: null,
      // All available links: null, generated in lib/inc/class.quicklinks.php
      staticLinks: null,
      // Custom Item form
      customItemForm: null,
      // Divider form
      dividerForm: null
    };
    const login = {
      // Login form container and elements
      container: null,
      form: null,
      // Status messages
      status: null,
    };

    const getLoc = where => {
      switch ( where ) {
        case 'locFront':
          return front.userLinks;
        case 'locEditor':
          return editor.userLinks;
        case 'locStatic':
          return editor.staticLinks;
        case 'loginStatus':
          return login.status;
        case 'editorStatus':
          return editor.status;
      }
    };
    /**
     * Input filter listener
     */
    const change = () => {
      const search_term = editor.filterInput.val();
      if ( search_term ) {
        [editor.userLinks, editor.staticLinks].map( $list => {
          // Hide non-matches
          $list.find( '.quick-item' ).not( ':Contains(' + search_term + ')' ).hide();
          // Show matches
          $list.find( '.quick-item' + ':Contains(' + search_term + ')' ).show();
        } );
      } else {
        // Show all.
        clear();
      }
    };

    /**
     * Input filter listener
     */
    const clear = () => {
      // clear callback: shows all items in associated list
      [editor.userLinks, editor.staticLinks].map( $list => {
        $list.children().show();
      } );
    };

    const attachFrontElements = () => {
      front.menu = $( '#network-header-menu' );
      front.container = $( '#quicklinks-container' );
      front.quickActions = front.container.find( '#quick-actions' );
      front.quickLaunch = front.quickActions.find( '#quick-launch' );
      front.userLinks = front.container.find( '#menu-links' );
      // Other actions
      showSpinners( ['locFront'] );
    };
    /**
     *
     * @param user
     */
    const initFront = user => {
      front.quickLaunch.prop( 'disabled', false );
      //setLoginElements( user );
    };
    /**
     *
     * @param user
     * @return {boolean}
     */
    const initEditor = user => {
      if ( !editor.container ) {
        return false;
      }
      hideDismissibles();
      setActiveForTouch();
      initExpandos();
      initDragDropSort();
      window.addEventListener( 'resize', initDragDropSort );
      $( '.ui-tooltip' ).remove();
    };
    /**
     *
     */
    const attachEditorElements = () => {
      // Cache DOM
      editor.container = $( '#quicklinks' );
      editor.status = editor.container.find( '.col-header .quick-status' );
      // Lists and filters
      editor.userLinks = editor.container.find( '#your-links' );
      editor.staticLinks = editor.container.find( '#static-links' );
      // Login form
      login.container = editor.container.find( '#quick-login' );
      login.form = login.container.find( '#quick-login-form' );
      login.status = login.container.find( '.quick-status' );
      // Filter staticLinks
      editor.filterInput = editor.container.find( '#quick-filter-input' );
      editor.filterInput.setup_filter( change, null, clear );
    };

    const setLoginElements = user => {
      doUserIcon( user );
      if ( editor.container ) {
        editor.container.find( '#user-tab button' )
          .data( 'tool', user.username ? `logout` : `show` )
          .text( user.username ? `Log out ${user.username}` : `Log in` );

        if ( login.form && login.form.hasClass( 'submitting' ) ) {
          // If login form is open
          if ( user.username ) {
            // Saved status icon
            login.form[0].reset();
            hideDismissibles();
            setStatus( user.status, 'editorStatus' );
          } else {
            setStatus( user.status, 'loginStatus', true );
          }
          login.form.removeClass( 'submitting' );
        }
      }
    };
    /**
     * Set user icon depending on login state.
     * @param user
     */
    const doUserIcon = user => {
      const $icon = document.querySelectorAll( '.quick-user-icon' );
      let title = '';
      for ( let i = 0; i < $icon.length; i++ ) {
        Common.elements.removeClass( $icon[i], 'bts' );
        Common.elements.removeClass( $icon[i], 'btb' );
        Common.elements.removeClass( $icon[i], 'unsaved' );
        Common.elements.removeClass( $icon[i], 'saved' );
        if ( user.username ) {
          title = `You are logged into Quick Links as ${user.username}. Your links will be saved automatically.`;
          Common.elements.addClass( $icon[i], 'bts' );
          Common.elements.addClass( $icon[i], 'saved' );
        } else if ( user.linksChanged ) {
          title = `You have custom Quick Links and you are not logged in. Log in to save or retrieve your Quick Links from your Williams user account.`;
          Common.elements.addClass( $icon[i], 'bts' );
          Common.elements.addClass( $icon[i], 'unsaved' );
        } else {
          title = `You are not logged into Quick Links. Log in to save changes.`;
          Common.elements.addClass( $icon[i], 'btb' );
        }
        $icon[i].setAttribute( 'title', title );
      }
    };
    /**
     * Build form for adding a custom label/link.
     * @param {jQuery} $linkElement
     * @param link
     */
    const initLinkForm = ( { $linkElement, link } ) => {
      closeAllLinkForms();

      const { title, url } = link;
      const $form = $linkElement.find( 'form' );

      if ( url && url !== 'undefined' ) {
        $form.find( '.custom-item-url' ).val( url );
      }
      $form.find( '.custom-item-title' ).val( title );

      $linkElement
        .addClass( 'editing' );
    };

    const closeAllLinkForms = () => {
      editor.userLinks
        .find( 'li.editing' )
        .removeClass( 'editing' );
    };

    /**
     * Helper function to convert touch to click for link utility buttons.
     */
    const setActiveForTouch = () => {
      [front.userLinks, editor.userLinks, editor.staticLinks]
        .filter( $links => !!$links )
        .map( $links => {
          $links[0].addEventListener( 'touchend', function ( e ) {
            const $item = $( e.target ).closest( '.quick-item' );
            $( this ).find( '.quick-item' ).removeClass( 'active' );
            $item.toggleClass( 'active' );
          } )
        } );
    };
    /**
     * Show/hide .dismissible elements
     * @param $target
     */
    const showDismissible = $target => {
      const $parent = $target.parent( '.dismissible' );
      $target.add( $parent ).show();
    };

    const hideDismissibles = () => $( '.dismissible' ).add( '.dismissible > *' ).hide();

    /**
     * Show and hide ajax spinners.
     * The spinner will be replaced by the loaded content.
     * @todo Fade content.
     *
     * @param locations { Array }
     */
    const showSpinners = locations => {
      const spinner = $( '#quicklinks-spinner-template' ).html();
      locations.map( where => {
        if ( Elements.getLoc( where ).length ) {
          Elements.getLoc( where ).html( spinner );
        }
      } );
    };

    /**
     * Add Draggable/Droppable behaviors to link lists
     *
     * @requires {$}
     */
    const initDragDropSort = () => {
      // Create sortable/draggable lists.
      // 'draggable' and 'dragstop' must be separate.
      if ( !editor || !editor.staticLinks.find( '.quick-item' ).length ) {
        return;
      }
      editor.staticLinks
        .find( '.quick-item' )
        .draggable( {
          connectToSortable: editor.userLinks,
          helper: 'clone',
          revert: 'invalid',
          containment: editor.container.find( '.quick-content' )
        } );

      editor.staticLinks
        .find( '.quick-item' )
        .on( 'dragstart', function ( event, ui ) {

          editor.userLinks.children().show();

          // Set height & width to match first li
          const $li = ui.helper.parent().find( 'li:first-child' );
          ui.helper
            .css( {
              width: $li.css( 'width' ),
              height: $li.css( 'height' )
            } );
        } );

      editor.userLinks
        .sortable( {
          start: function ( e, ui ) {
            Events.emit( 'beforeSortable', { item: ui.item } );
            // If this link is from the same list, create a
            // temporary attribute on the link with the original index.
            if ( !ui.item.hasClass( 'ui-draggable' ) ) {
              ui.item.data( 'original', ui.item.index() );
            }
          },
          update: function ( e, ui ) {
            const original = ui.item.data( 'original' );

            if ( typeof original !== 'number' ) {
              // We're inserting.
              Events.emit( 'afterSortable', { type: 'insert', item: ui.item } );

            } else {
              // We're swapping.
              const current = ui.item.index();
              ui.item.removeData( 'original' );

              Events.emit( 'afterSortable', {
                type: 'swap',
                current: current,
                original: original,
                item: ui.item
              } );
            }
          }
        } );
    };

    const initExpandos = () => {
      $( '#ql-expandos' ).expando( {
        hideAnchor: true,
        singleOpen: true/*,
         open: 3*/
      } );
    };

    /**
     * Replace mega menu with Quicklinks.
     * @param menuToggled {Boolean}
     */
    const toggleMenu = ( menuToggled ) => {
      front.menu.toggleClass( 'quicklinks-only', menuToggled );
    };

    const setStatus = ( message, where, noFade = false ) => {
      if ( getLoc( where ) ) {
        if ( noFade ) {
          getLoc( where ).html( message );
        } else {
          getLoc( where ).find( '.fade-out' ).remove();
          getLoc( where ).html( `<span class="fade-out"> ${message} </span>` );
        }
      }
    };

    const fadeBackground = index => {
      if ( index === false ) {
        return;
      }

      const userLinksArr = [front.userLinks];
      if ( editor.userLinks ) {
        userLinksArr.push( editor.userLinks );
      }

      $( userLinksArr ).each( function () {
        $( this )
          .find( 'li' ).eq( index )
          .removeClass( 'fade-background' )
          .addClass( 'fade-background' );
      } );
    };

    /**
     * Add google analytics event tracking to Landing Page links
     */
    const addGaTracking = () => {
      if ( typeof _gaq == 'undefined' ) {
	      // Tracking handled by Google Tag Manger (GTM)
          return;
      }
      $( document ).on( 'click', 'li.quick-item a', e => {
        const label = e.target.text;
        const url = e.target.href;
        const event_label = `${label}: ${url}`;
        _gaq.push( ['_trackEvent', 'Quick Links', 'Menu Click', event_label] );
      } );
      $( document ).on( 'click', '.quick-tool', e => {
        const tool = e.target.getAttribute( 'data-tool' );
        _gaq.push( ['_trackEvent', 'Quick Links', 'Tool Click', tool] );
      } );
    };

    return {
      getLoc: getLoc,
      toggleMenu: toggleMenu,
      attachFrontElements: attachFrontElements,
      attachEditorElements: attachEditorElements,
      showSpinners: showSpinners,
      initEditor: initEditor,
      initDragDropSort: initDragDropSort,
      initFront: initFront,
      initLinkForm: initLinkForm,
      closeAllLinkForms: closeAllLinkForms,
      setStatus: setStatus,
      showDismissible: showDismissible,
      hideDismissibles: hideDismissibles,
      setLoginElements: setLoginElements,
      fadeBackground: fadeBackground,
      addGaTracking: addGaTracking
    };
  })( window.jQuery );
