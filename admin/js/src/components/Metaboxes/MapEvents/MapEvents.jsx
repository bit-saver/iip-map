import React, {
  useEffect, useReducer, useState
} from 'react';
import * as PropTypes from 'prop-types';

import {
  Tab, Tabs, TabList, TabPanel
} from 'react-tabs';

import MapProject from './Tabs/MapProject';
import MapFields from './Tabs/MapFields';
import MapCard from './Tabs/MapCard';
import EventDownloader from './Tabs/EventDownloader';
import EventGeocoder from './Tabs/EventGeocoder';

import screendoorProject from '../../../utils/ScreendoorProject';

import './MapEvents.scss';

const TABS = {
  Project: 0,
  MapFields: 1,
  MapCard: 2,
  EventDownloader: 3,
  EventGeocoder: 4
};

const defaultTabBooleans = {
  [TABS.Project]: false,
  [TABS.MapFields]: false,
  [TABS.MapCard]: false,
  [TABS.EventDownloader]: false,
  [TABS.EventGeocoder]: false
};

const parseEventCounts = ( eventCounts ) => {
  const needGeocoding = parseInt( eventCounts.total, 10 ) - parseInt( eventCounts.geocoded, 10 );
  return {
    needGeocoding,
    downloading: eventCounts.total === '0',
    geocoding: needGeocoding > 0
  };
};

const MapEvents = ( { project } ) => {
  const [mergeState, setState] = useReducer( ( state, update ) => ( { ...state, ...update } ), {
    projectId: project.projectId,
    form: project.form,
    mapping: project.mapping,
    card: project.card,
    tab: 0,
    needsUpdate: { ...defaultTabBooleans },
    nextPage: false
  } );

  const [eventCounts, setEventCounts] = useState( {
    total: project.events.total,
    geocoded: project.events.geocoded
  } );

  const [dirtyTabs, setDirty] = useReducer( ( state, update ) => ( { ...state, ...update } ), {
    ...defaultTabBooleans
  }, ( initial ) => {
    const parsed = parseEventCounts( eventCounts );
    initial[TABS.EventDownloader] = parsed.downloading;
    initial[TABS.EventGeocoder] = parsed.geocoding;
    return initial;
  } );
  const setDirtyTab = tabIndex => val => setDirty( { [tabIndex]: val } );

  const [processingTab, setProcessingTab] = useState( null );
  const setProcessing = tabIndex => val => setProcessingTab( val ? tabIndex : null );

  const {
    projectId, form, mapping, card, tab
  } = mergeState;

  const setCard = val => setState( { card: val } );
  const setTab = val => setState( { tab: val } );

  const getNeedsUpdate = ( tabIndex ) => {
    const update = { ...mergeState.needsUpdate };
    Object.keys( defaultTabBooleans ).forEach( ( key ) => {
      if ( key > tabIndex ) {
        update[key] = true;
      }
    } );
    return update;
  };

  const setTabUpdated = tabIndex => () => setState( { needsUpdate: { ...mergeState.needsUpdate, [tabIndex]: false } } );

  const isDisabled = ( tabIndex ) => {
    if ( processingTab && processingTab !== tabIndex ) return true;

    if ( tabIndex > TABS.Project ) {
      if ( !projectId ) return true;
      if ( !form || form.length < 1 ) return true;
    }
    if ( tabIndex > TABS.MapFields ) {
      if ( !mapping ) return true;
      if ( !mapping.availableFields || form.length === mapping.availableFields.length ) return true;
      if ( mapping.nameFields.length < 1 ) return true;
      if ( mapping.locationFields.length < 1 ) return true;
    }
    if ( tabIndex > TABS.MapCard ) {
      if ( !card ) return true;
    }
    if ( tabIndex > TABS.EventDownloader ) {
      if ( eventCounts.total === '0' ) return true;
    }
    return false;
  };

  const doNext = () => {
    if ( tab < TABS.EventGeocoder ) {
      setState( { nextPage: true } );
    }
  };

  const saveProject = async ( id ) => {
    const formData = await project.getFields( id );
    return project.save( {
      projectId: id,
      form: formData
    } )
      .then( ( result ) => {
        // console.log( 'save result', result );
        if ( result.success ) {
          setDirty( {
            [TABS.Project]: false,
            [TABS.MapFields]: true,
            [TABS.MapCard]: !!( project.card ) || dirtyTabs[TABS.MapCard],
            [TABS.EventGeocoder]: true,
            [TABS.EventDownloader]: true
          } );
          const update = {
            projectId: id,
            form: formData,
            mapping: project.mapping,
            nextPage: true,
            needsUpdate: getNeedsUpdate( TABS.Project )
          };
          setEventCounts( result.events );
          if ( !project.card ) {
            project.card = card;
          } else {
            update.card = project.card;
          }
          setState( update );
        }
        return result;
      } );
  };

  const saveMapping = mappingData => project.save( {
    mapping: mappingData
  } )
    .then( ( result ) => {
      // console.log( 'save result', result );
      if ( result.success ) {
        setDirty( {
          [TABS.MapFields]: false,
          [TABS.MapCard]: true,
          [TABS.EventGeocoder]: true,
          [TABS.EventDownloader]: true
        } );
        setEventCounts( result.events );
        setState( {
          mapping: mappingData,
          card: null,
          nextPage: true,
          needsUpdate: getNeedsUpdate( TABS.MapFields )
        } );
      }
      return result;
    } );

  const saveCard = cardData => project.save( {
    card: cardData
  } )
    .then( ( result ) => {
      // console.log( 'save result', result );
      if ( result.success ) {
        setDirty( { [TABS.MapCard]: false } );
        setState( {
          card: cardData,
          nextPage: true,
          needsUpdate: getNeedsUpdate( TABS.MapCard )
        } );
      }
      return result;
    } );

  const doSave = ( ...args ) => new Promise( ( resolve, reject ) => {
    const handleError = ( err ) => {
      console.log( err );
      if ( err.response ) {
        return reject( err.response.data );
      }
      reject( err );
    };
    const handleSavePromise = promise => promise
      .then( ( result ) => {
        if ( result.success ) {
          return resolve();
        }
        reject( result.error );
      } )
      .catch( handleError );
    if ( tab === TABS.Project ) {
      handleSavePromise( saveProject( ...args ) );
      return;
    }
    if ( tab === TABS.MapFields ) {
      handleSavePromise( saveMapping( ...args ) );
      return;
    }
    if ( tab === TABS.MapCard ) {
      handleSavePromise( saveCard( ...args ) );
      return;
    }
    doNext();
    resolve();
  } );

  const classNameHelper = tabIndex => ( {
    'react-tabs__tab': true,
    'map-events-tabs--dirty': !isDisabled( tabIndex ) && dirtyTabs[tabIndex]
  } );

  useEffect( () => {
    if ( mergeState.nextPage ) {
      setState( {
        tab: tab + 1,
        nextPage: false
      } );
    }
  }, [
    mergeState.mapping, mergeState.card, mergeState.projectId, mergeState.form, mergeState.nextPage
  ] );

  useEffect( () => {
    const parsed = parseEventCounts( eventCounts );
    setDirty( {
      [TABS.EventDownloader]: parsed.downloading,
      [TABS.EventGeocoder]: parsed.geocoding
    } );
  }, [eventCounts.total, eventCounts.geocoded] );

  useEffect( () => {
    if ( !isDisabled( TABS.EventDownloader ) ) {
      setTab( TABS.EventDownloader );
    } else if ( !isDisabled( TABS.MapCard ) ) {
      setTab( TABS.MapCard );
    } else if ( !isDisabled( TABS.MapFields ) ) {
      setTab( TABS.MapFields );
    }
  }, [] );

  const hasDirtyTab = Object.keys( dirtyTabs )
    .reduce( ( dirty, tabIndex ) => dirty || ( dirtyTabs[tabIndex] && !isDisabled( tabIndex ) ), false );

  return (
    <div className="iip-map-admin-mapping">
      <h2 className="iip-map-admin-metabox-header">Map Fields and Save Events</h2>
      <div className="iip-map-admin-mapping__inner">
        <h4 className="iip-map-admin-metabox-subheader">
        Use this form to map the form values from Screendoor.
        </h4>
        <div className="iip-map-admin-mapping__header">
          <div className="iip-map-admin-mapping__warning" style={ { visibility: hasDirtyTab ? 'visible' : 'hidden' } }>
          * Indicates a tab with unsaved changes or required action.
          </div>
        </div>
        <Tabs
          className="map-events-tabs"
          forceRenderTabPanel
          selectedIndex={ tab }
          onSelect={ setTab }
        >
          <TabList>
            <Tab
              className={ classNameHelper( TABS.Project ) }
              disabled={ isDisabled( TABS.Project ) }
            >
              <span>Select Project</span>
            </Tab>
            <Tab
              className={ classNameHelper( TABS.MapFields ) }
              disabled={ isDisabled( TABS.MapFields ) }
            >
              <span>Field Mapper</span>
            </Tab>
            <Tab
              className={ classNameHelper( TABS.MapCard ) }
              disabled={ isDisabled( TABS.MapCard ) }
            >
              <span>Configure Card</span>
            </Tab>
            <Tab
              className={ classNameHelper( TABS.EventDownloader ) }
              disabled={ isDisabled( TABS.EventDownloader ) }
            >
              <span>Event Downloader</span>
            </Tab>
            <Tab
              className={ classNameHelper( TABS.EventGeocoder ) }
              disabled={ isDisabled( TABS.EventGeocoder ) }
            >
              <span>Event Geocoder</span>
            </Tab>
          </TabList>
          <TabPanel>
            <MapProject
              projectId={ projectId }
              doSave={ doSave }
              setDirtyTab={ setDirtyTab( TABS.Project ) }
            />
          </TabPanel>
          <TabPanel>
            <MapFields
              form={ form }
              mapping={ mapping }
              doSave={ doSave }
              doNext={ doNext }
              isDirty={ dirtyTabs[TABS.MapFields] }
              setDirty={ setDirtyTab( TABS.MapFields ) }
              setUpdated={ setTabUpdated( TABS.MapFields ) }
              needsUpdate={ mergeState.needsUpdate[TABS.MapFields] }
              getDefaultMapping={ project.getDefaultMapping }
            />
          </TabPanel>
          <TabPanel>
            <MapCard
              form={ form }
              mapping={ mapping }
              card={ card }
              setCard={ setCard }
              getCardFromMapping={ project.getCardFromMapping }
              getSample={ project.getSample }
              doSave={ doSave }
              doNext={ doNext }
              isDirty={ dirtyTabs[TABS.MapCard] }
              setDirty={ setDirtyTab( TABS.MapCard ) }
              needsUpdate={ mergeState.needsUpdate[TABS.MapCard] }
              setUpdated={ setTabUpdated( TABS.MapCard ) }
            />
          </TabPanel>
          <TabPanel>
            <EventDownloader
              project={ project }
              eventCounts={ eventCounts }
              setEventCounts={ setEventCounts }
              doNext={ doNext }
              needsUpdate={ mergeState.needsUpdate[TABS.EventDownloader] }
              setUpdated={ setTabUpdated( TABS.EventDownloader ) }
              setProcessing={ setProcessing( TABS.EventDownloader ) }
            />
          </TabPanel>
          <TabPanel>
            <EventGeocoder
              project={ project }
              eventCounts={ eventCounts }
              setEventCounts={ setEventCounts }
              isDirty={ dirtyTabs[TABS.EventGeocoder] }
              setProcessing={ setProcessing( TABS.EventGeocoder ) }
            />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};

MapEvents.propTypes = {
  project: PropTypes.object
};

MapEvents.defaultProps = {
  project: screendoorProject
};

export default MapEvents;
