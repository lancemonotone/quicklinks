/**
 * @todo Check for duplicate links.
 */
"use strict";

import { fetchApi } from './utils.es6.js';
import { Events } from '../../../../../assets/js/src/modules/class.events.es6.js';
import { Elements } from './class.elements.es6.js';

export const Links = (
  function ( $ ) {
    const locations = {
      locFront: null,
      locEditor: null,
      locStatic: null
    };

    const linkTypes = {
      locStatic: $( '#link-static' ),
      locEditor: $( '#link-editor' ),
      locEditorCat: $( '#link-editor-cat' ),
      locFront: $( '#link-front' ),
      locFrontCat: $( '#link-front-cat' )
    };

    /**
     * 1. Initialize user.
     * 2. Fetch user links.
     * 3. Convert link strings to html.
     * 4. Load into page.
     */
    const init = ( links ) => {
      update( links );
      if ( !locations.locStatic ) {
        buildStaticLinks();
      }
      loadAll();
    };

    const update = links => {
      buildUserLinks( where => {
        buildLinks( links, where );
      } );
    };

    /**
     * Generate flexiform links
     */
    const buildStaticLinks = () => {
      return fetchApi( 'quicklinks_get_static_links' )
        .then( links => buildLinks( links, 'locStatic' ) );
    };

    const loadAll = ( index = false ) => {
      Object.keys( locations )
        .filter( key => locations[key] )
        .map( where => loadLinksByLocation( where ) );

      if ( index !== false ) {
        Events.emit( 'updateUserLinks', allToArray() );
      }

      Events.emit( 'afterLoadLinks', index );
    };

    const loadLinksByLocation = ( where ) => {
      const $el = Elements.getLoc( where );
      if ( $el && $el.length ) {
        const linksHtml = locations[where].join( '\n' );
        const htmlEncodedLinks = htmlEntitiesEncode(linksHtml);
        const htmlDecodedLinks = htmlEntitiesDecode(htmlEncodedLinks);
        $el.html( htmlDecodedLinks );
      }
    };

    const htmlEntitiesEncode = str => {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    const htmlEntitiesDecode = str => {
      var txt = document.createElement('textarea');
      txt.innerHTML = str;
      return txt.value;
    };

    /**
     * Populate link arrays with HTML as per callback.
     * Editor links have extra markup for editing interface.
     * @param callback
     */
    const buildUserLinks = callback => {
      ['locFront', 'locEditor'].map( where => {
        if ( typeof callback === 'function' ) {
          callback( where );
        }
      } );
    };

    /**
     * Split complete cookie string and map each HTML link to locations.
     * @param links
     * @param where
     */
    const buildLinks = ( links, where ) => {
      locations[where] = [];
      links.map( link => addLinkToLocation( link, where ) );
      /*Object.keys( links ).map( link => {
       const linkObj = {title: link, url: links[link]};
       addLinkToLocation( linkObj, where );
       } );*/
    };

    /**
     * Map links to specified locations.
     * @param link { Object }
     * @param where { String }
     * @param index { Number | null }
     */
    const addLinkToLocation = ( link, where, index = null ) => {
      // Where to append, prepend, or insert?
      index = index === null ? locations[where].length : index;

      // Generate link HTML string and add to location.
      spliceLinks( where, index, buildLinkHtml( link, where ) );
    };

    /**
     * Construct link HTML from script template HTML
     * @param title {String}
     * @param url {String}
     * @param where {String}
     */
    const buildLinkHtml = ( { title, url }, where ) => {
      let type = '';

      if ( url === null || url === "undefined" || url === undefined || url === '' ) {
        type = 'Cat';
      }

      return linkTypes[where + type]
        .html()
        .replace( '##title##', title )
        .replace( '##url##', encodeURI(url) );
    };

    /**
     * Return array of link objects { title, url } for saving to server.
     * Use Front because it always exists.
     * @returns {Array}
     */
    const allToArray = () => {
      const links = [];
      locations['locFront'].map( link => {
        links.push( extractLink( link ) );
      } );

      return links;
    };
    /**
     * Converts array of links into JSON compatible cookie object.
     * @returns {{}}
     */
    const linksToCookieObject = links => {
      const linksObj = {};
      let count = 0;
      links.map( ( { title, url } ) => {
        // Need parentheses
        if ( !(title in linksObj) ) {
          linksObj[(count++).toString()] = { title, url };
        }
      } );
      return encodeURIComponent( JSON.stringify( linksObj ) );
    };

    /**
     *
     * @param link
     * @return {{title: *, url: *}}
     */
    function extractLink( link ) {
      let title, url;
      title = $( link )[0].textContent.trim();

      const anchor = $( link ).find( 'a' );
      if ( anchor.length ) {
        url = anchor[0].href;
      }
      return { title, url };
    }

    /**
     * Converts links string to a compatible array for Links class.
     * @param links
     * @return {*}
     */
    function cookieObjectToLinks( links ) {
      if ( !links ) {
        return false;
      }

      links = decodeURIComponent( links );

      // If it's not already an
      if ( !isArray( links ) && !isObject( links ) ) {
        // Is it a JSON string?
        try {
          links = JSON.parse( links );
        }
          // Is it legacy quicklinks with heart and spade separators
        catch ( e ) {
          links = legacyLinksToArray( links );
        }
      }
      if ( isObject( links ) ) {
        links = objToArray( links );
      }
      return links;
    }

    const objToArray = obj => {
      const arr = [];
      Object.keys( obj ).map( key => {
        const link = obj[key]//{title, url};
        arr.push( link );
      } );
      return arr;
    };

    const pair_sep = '\u2660'; // spade
    const name_val_sep = '\u2665'; // heart
    /**
     * Convert old-school Meerkat QL links string to array.
     * @param links
     * @return {Array}
     */
    const legacyLinksToArray = links => {
      const linksArr = [];
      links.split( pair_sep )
        .map( link => {
          const parts = legacyLinkToObj( link );
          if ( parts.title ) {
            linksArr.push( parts );
          }
        } );
      return linksArr.length ? linksArr : '';
    };

    /**
     * Convert single link string into object.
     * @param link
     * @returns {{title: *, url: *}}
     */
    const legacyLinkToObj = link => {
      const linkParts = link.split( name_val_sep );
      return {
        title: linkParts[0],
        url: linkParts[1]
      };
    };

    const isObject = o => {
      return (!!o) && (o.constructor === Object);
    };

    const isArray = a => {
      return (!!a) && (a.constructor === Array);
    };

    /**
     * Add or remove links (if no added) from location.
     *
     * Add: arr.splice(index, 0, added);
     * Remove: arr.splice(index, 1);
     *
     * @param where {String}
     * @param index {Number}
     * @param added {String}
     */
    const spliceLinks = ( where, index, added ) => {
      const loc = locations[where];
      return added ? loc.splice( index, 0, added ) : loc.splice( index, 1 );
    };

    /**
     * Remove user link at index.
     * @param index {Number}
     */
    const remove = index => {
      buildUserLinks( where => spliceLinks( where, index ) );
      loadAll( index );
    };

    /**
     * Insert/Swap positions of links in locations array.
     *
     * @param index
     * @param original
     */
    const swap = ( { index, original } ) => {
      buildUserLinks( where => spliceLinks( where, index, spliceLinks( where, original )[0] ) );
      loadAll( index );
    };

    /**
     * Append new link to quicklinks string.
     * @param link
     * @param index
     */
    const insert = ( { link, index } ) => {
      buildUserLinks( where => addLinkToLocation( link, where, index ) );
      loadAll( index );
    };

    /**
     * Prepend new link to quicklinks string.
     *
     * @param link
     */
    const prepend = link => {
      const index = 0;
      insert( { link, index } );
    };

    const save = ( { link, index } ) => {
      // Insert at index.
      buildUserLinks( where => addLinkToLocation( link, where, index ) );
      // Remove index + 1.
      remove( index + 1 );
    };

    return {
      init: init,
      update: update,
      insert: insert,
      prepend: prepend,
      remove: remove,
      swap: swap,
      loadAll: loadAll,
      save: save,
      cookieObjectToLinks: cookieObjectToLinks,
      linksToCookieObject: linksToCookieObject
    };
  }
)( window.jQuery );
