import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import CustomTextField from '../components/CustomTextField';
import CustomButton from '../components/CustomButton';
import adminSidebarSections from '../components/layout/AdminDashboardSidebar';
import { useNavigate } from 'react-router-dom';

const CreateTeacherLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    subject: ''
  });
  const [touched, setTouched] = React.useState({});
  const [errors, setErrors] = React.useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    if (!form.subject) newErrors.subject = 'Subject is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // TODO: Connect to backend or API
    alert('Teacher account created!');
    navigate(-1); // Go back
  };

  return (
    <DashboardLayout userRole="Administrator" sidebarItems={adminSidebarSections}>
      <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow mt-10">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Teacher Login</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <CustomTextField
            id="name"
            name="name"
            type="text"
            label="Name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            touched={touched.name}
          />
          <CustomTextField
            id="email"
            name="email"
            type="email"
            label="Email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
          />
          <CustomTextField
            id="password"
            name="password"
            type="password"
            label="Password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            touched={touched.password}
            isPassword
          />
          <CustomTextField
            id="subject"
            name="subject"
            type="text"
            label="Subject"
            value={form.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.subject}
            touched={touched.subject}
          />
          <div className="flex justify-between mt-6 gap-4">
            <CustomButton type="button" onClick={() => navigate(-1)} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
              Cancel
            </CustomButton>
            <CustomButton type="submit">
              Create
            </CustomButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateTeacherLogin; 