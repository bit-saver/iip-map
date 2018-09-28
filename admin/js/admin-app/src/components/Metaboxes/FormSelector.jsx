import React from 'react';
import { func, string } from 'prop-types';

import { getScreendoorFields } from '../../utils/screendoor';
import { capitalize } from '../../utils/texttransforms';

const FormSelector = ( { formType, projectId, setId } ) => (
  <div className="iip-map-admin-screendoor-project-container" id={ `${formType}-project-selector` }>
    <form className="iip-map-admin-project-form">
      <label className="iip-map-admin-label" htmlFor={ `${formType}-project-id` }>
        { capitalize( formType ) } Project ID:
        <input
          className="iip-map-admin-project-input"
          id={ `${formType}-project-id` }
          name={ `${formType}-project-id` }
          onChange={ setId }
          type="text"
          value={ projectId }
        />
      </label>

      <button
        className="button button-primary button-large"
        id={ `iip-map-select-${formType}-project` }
        onClick={ () => { getScreendoorFields( projectId, '' ); } }
        type="button"
      >
        Select This Project
      </button>

    </form>
  </div>
);

FormSelector.propTypes = {
  formType: string,
  projectId: string,
  setId: func
};

export default FormSelector;