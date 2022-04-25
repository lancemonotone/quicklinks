/**
 * @requires 'url-search-params-polyfill'
 * @requires 'whatwg-fetch'
 * @param action {String}
 * @param obj {Object}
 * @return Promise
 *
 * fetchApi( 'ajax_action', user )
 * .then( function ( responseObj ) {
 *    // This could be another fetchApi call.
 *    someCallback( responseObj );
 *  } )
 *  .then( function () {
 *    someOtherCallback();
 *  } );
 *
 */

"use strict";

//import 'url-search-params-polyfill';
import 'whatwg-fetch';

export const fetchApi = ( action, obj = null ) => {
  //console.log( 'Begin fetch:', action, obj );
  const payload = {
    action: action,
    obj: JSON.stringify(obj)
  };

  const data = new FormData();
  //data.append( 'json', JSON.stringify( payload ) );

  Object.keys( payload ).map( key => {
    data.append( key, payload[key] )
  } );

  const init = {
    method: 'POST',
    body: data,
    credentials: 'same-origin'
  };

  /* const params = new URLSearchParams();

   Object.keys( payload ).map( key => {
   params.set( key, payload[key] )
   } );*/


  /*const request = new Request( myAjax.ajaxurl,  {
   method: 'POST',
   body: params,
   credentials: 'same-origin'
   });*/

  //return fetch( request )
  return fetch( myAjax.ajaxurl, init )
    .then( function ( response ) {
      if ( response.ok ) {
        //console.log( 'End fetch:', action );
        return response.json();
      }
    } )
    // Uncomment to test response.json. This will cause the Promise to return undefined.
    //.then( data => console.log( JSON.stringify( data ) ) )
    .catch( function ( error ) {
      console.log( 'Fetch error:', error.message );
      return false;
    } );
};