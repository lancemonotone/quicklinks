/**
 * @module Cookies
 *
 * Cookie store and utilities
 */
"use strict";
export const Cookies = (function () {
  const expires = new Date( 2030, 10, 30 );

  let cookies = {};

  /**
   * 1. Initialize cookies property with map object in this form:
   *    {
   *      easyName0: 'longAndComplicatedName0',
   *      easyName1: 'longAndComplicatedName1',
   *      easyName2: 'longAndComplicatedName2'
   *    }
   *
   * 2. Initialize status cookie.
   * 3. Load cookie values into passed in object.
   *
   * @param cookiesMap {Object}
   */
  const init = ( cookiesMap ) => {
    cookies = cookiesMap;
  };

  /**
   * Return single cookie value.
   * @param key
   * @returns {*}
   */
  const get = key => readCookie( cookies[key] );

  /**
   * Set single cookie value.
   * @param key
   * @param value
   * @param persistent
   * @private
   */
  const set = ( key, value, persistent = true ) => {
    if ( value !== false ) {
      const exp = persistent ? `expires=${expires};` : ``;
      document.cookie = `${cookies[key]}=${value};domain=${myAjax.domain};path=/;${exp}`;
    }
    //console.log( "Set", cookies[key] + ":", get( key ) );
  };

  /**
   * Set all object property values to matching cookie values.
   * @private
   */
  const mapPropertiesToObj = obj => {
    Object.keys( obj ).map( key => {
      obj[key] = get( key );
    } );
  };

  /**
   * Set cookie values to object property values.
   * @param updated
   * @private
   */
  const updateAll = updated => {
    Object.keys( updated ).map( key => set( key, updated[key] ) );
  };

  /**
   * Unset single cookie value.
   * @param key
   * @private
   */
  const unset = key => set( key, '' );

  /**
   * Unset all cookie values.
   * @private
   */
  const unsetAll = () => Object.keys( cookies ).map( key => unset( key ) );

  /**
   * Utility function to retrieve single cookie value.
   * @param key
   * @returns {*}
   * @private
   */
  const readCookie = ( key ) => {
    const nameEQ = key + "=";
    const ca = document.cookie.split( ';' );
    for ( let i = 0; i < ca.length; i++ ) {
      let c = ca[i];
      while ( c.charAt( 0 ) == ' ' ) {
        c = c.substring( 1, c.length );
      }
      if ( c.indexOf( nameEQ ) == 0 ) {
        return c.substring( nameEQ.length, c.length );
      }
    }
    return false;
  };

  /**
   * Output cookie values to console.
   * @private
   */
  const logAll = () => {
    Object.keys( cookies ).map( key => console.log( cookies[key], ":", get( key ) ) );
  };

  return {
    init: init,
    get: get,
    set: set,
    unset: unset,
    mapPropertiesToObj: mapPropertiesToObj,
    updateAll: updateAll,
    unsetAll: unsetAll,
    logAll: logAll
  }
})();