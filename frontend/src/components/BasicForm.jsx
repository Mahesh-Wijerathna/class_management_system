import React from 'react';
import { Formik, Form } from 'formik';

const BasicForm = ({ initialValues, validationSchema, onSubmit, children }) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched, handleChange, values }) => (
        <Form className='flex flex-col w-full space-y-6'>
          {/* Children will be the form fields and buttons */}
          {children({ errors, touched, handleChange, values })}
        </Form>
      )}
    </Formik>
  );
};

export default BasicForm; 