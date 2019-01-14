import React, { Component, Fragment } from 'react';
import { array, string } from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';

import Column from '../../Components/Column/Column';
import ItemGroup from '../../Components/Column/ItemGroup';

import { getMapMeta, getScreendoorFieldsMeta } from '../../utils/globals';
import { saveScreendoorFields } from '../../utils/screendoor';

class ScreendoorFieldMapper extends Component {
  constructor( props ) {
    super( props );
    this.state = {
      additionalFields: getScreendoorFieldsMeta.otherArr,
      availableFields: getScreendoorFieldsMeta.availableArr,
      dateField: getScreendoorFieldsMeta.dateArr,
      fields: getScreendoorFieldsMeta.fields,
      locationFields: getScreendoorFieldsMeta.locationArr,
      nameField: getScreendoorFieldsMeta.nameArr,
      timeField: getScreendoorFieldsMeta.timeArr
    };

    this.onDragEnd = this.onDragEnd.bind( this );
  }

  componentDidUpdate( prevProps ) {
    const { data } = this.props;

    const fields = this.getDraggableFields();
    const availableFields = Array.from( data );

    if ( data !== prevProps.data ) {
      this.setState( {
        fields,
        availableFields
      } );
    }
  }

  onDragEnd( result ) {
    const { destination, draggableId, source } = result;
    const { fields } = this.state;

    if ( !destination ) {
      return;
    }

    if (
      destination.droppableId === source.droppableId
      && destination.index === source.index
    ) {
      return;
    }

    const startGroup = source.droppableId;
    const endGroup = destination.droppableId;

    if ( startGroup === endGroup ) {
      const { [startGroup]: start } = this.state;

      const newOrder = Array.from( start );
      newOrder.splice( source.index, 1 );
      newOrder.splice( destination.index, 0, fields[draggableId] );

      this.setState( {
        [startGroup]: newOrder
      } );
    }

    if ( startGroup !== endGroup ) {
      const { [startGroup]: start } = this.state;
      const { [endGroup]: end } = this.state;

      const removeFromColumn = Array.from( start );
      const addToColumn = Array.from( end );

      removeFromColumn.splice( source.index, 1 );
      addToColumn.splice( destination.index, 0, fields[draggableId] );

      this.setState( {
        [startGroup]: removeFromColumn,
        [endGroup]: addToColumn
      } );
    }
  }

  getDraggableFields() {
    const { data } = this.props;

    const fields = {};

    data.forEach( ( item ) => {
      fields[item.field] = {
        field: item.field,
        name: item.name
      };
    } );

    return fields;
  }

  render() {
    const { id } = this.props;
    const {
      additionalFields, availableFields, dateField, fields, locationFields, nameField, timeField
    } = this.state;

    // function cleanData( arr ) {
    //   const newObj = {};

    //   arr.forEach( ( item ) => {
    //     const { name } = item;
    //     const { field } = item;
    //     const nameStr = name.split( ' ' ).join( '_' );

    //     newObj[nameStr] = field;
    //   } );

    //   return newObj;
    // }

    const dataObj = {
      available: availableFields,
      date: dateField,
      fields,
      location: locationFields,
      name: nameField,
      other: additionalFields,
      postId: getMapMeta.id,
      projectId: id,
      time: timeField
    };

    const clearDataObj = {
      available: [],
      date: [],
      fields: {},
      location: [],
      name: [],
      other: [],
      postId: getMapMeta.id,
      projectId: '',
      time: []
    };

    return (
      <Fragment>
        <div className="iip-map-admin-screendoor-dragdrop">
          <DragDropContext onDragEnd={ this.onDragEnd }>
            <Column title="Available Fields">
              <ItemGroup data={ availableFields } id="availableFields" />
            </Column>
            <Column title="Map To:">
              <ItemGroup data={ nameField } id="nameField" required title="Item Name:" />
              <ItemGroup data={ locationFields } id="locationFields" required title="Location:" />
              <ItemGroup data={ dateField } id="dateField" title="Date:" />
              <ItemGroup data={ timeField } id="timeField" title="Time:" />
              <ItemGroup data={ additionalFields } id="additionalFields" title="Additional Data:" />
            </Column>
          </DragDropContext>
        </div>
        <button type="button" onClick={ () => { saveScreendoorFields( dataObj ); } }>
          Save Form Data
        </button>
        <button type="button" onClick={ () => { saveScreendoorFields( clearDataObj ); } }>
          Clear Form Data
        </button>
      </Fragment>
    );
  }
}

ScreendoorFieldMapper.propTypes = {
  data: array,
  id: string
};

export default ScreendoorFieldMapper;
