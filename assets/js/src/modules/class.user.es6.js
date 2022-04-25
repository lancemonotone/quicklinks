/**
 * @module User Singleton
 *
 * Holds state of login, personal links, etc.
 */
"use strict";
import { fetchApi } from './utils.es6.js';
import { Events } from '../../../../../assets/js/src/modules/class.events.es6.js';
/**
 *
 * @type {{defaultChanged, getUser, getProperty, setProperties, init, save, doLogin, doLogout}}
 */
export const User = (function () {
  const user = {
    status: 'init',
    username: false,
    isSuper: false,
    quicklinks: false,
    linksChanged: false
  };
  /**
   *
   * @param action
   */
  const doEmit = action => {
    //console.log( 'Status:', getProperty( 'status' ) );
    Events.emit( action, getProperty( 'quicklinks' ) );
  };
  /**
   * Send user to server.
   * If the user has links in the db, get them.
   * If not, we'll use the cookie links.
   * If still not, fall back on the default.
   *
   * @requires {Events}
   * @requires {fetchApi}
   */
  const init = user => {
    setProperties( user );
    doFetch()
      .then( user => {
        if ( user ) {
          setProperties( user );
          doEmit( 'afterInitUser' );
        }
      } );
  };
  /**
   *
   * @param user
   * @param login
   */
  const update = ( user, login = false ) => {
    setProperties( user );
    // Save if logged in.
    if ( login ) {
      doEmit( 'afterInitUser' );
    } else if ( getProperty( 'username' ) ) {
      save();
    }
  };
  /**
   *
   */
  const save = () => {
    setProperty( 'status', 'put' );
    doFetch()
      .then( user => {
        setProperties( user );
        Events.emit( 'afterSaveUser', user );
      } );
  };
  /**
   *
   */
  const doFetch = () => fetchApi( 'quicklinks_update_user', user );
  /**
   *
   * @param login
   */
  const doLogin = login => {
    return fetchApi( 'quicklinks_login', login )
      .then( user => {
        if ( !user.username ) {
          Events.emit( 'afterLoginFail', user );
          return;
        }
        update( user, true );
      } );
  };
  /**
   * Set all user properties.
   *
   * @param user
   * @returns {boolean}
   * @private
   * @requires {Events}
   */
  const setProperties = user => {
    Object.keys( user ).map( function ( key ) {
      setProperty( key, user[key] );
    } );
  };

  /**
   * Return _user object.
   *
   * @returns {{logged: boolean, status: string, user: string, isSuper: boolean, quicklinks: string}}
   * @private
   */
  const getUser = () => user;

  /**
   * Return single user property.
   *
   * @param key
   * @returns {*}
   * @private
   */
  const getProperty = key => user[key];

  /**
   * Return single user property.
   *
   * @param key
   * @param value
   * @returns {*}
   * @private
   */
  const setProperty = ( key, value ) => user[key] = value;

  return {
    init: init,
    update: update,
    getUser: getUser,
    getProperty: getProperty,
    setProperties: setProperties,
    doLogin: doLogin
  };
})();