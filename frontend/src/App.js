
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { authRoutes, adminRoutes, adminDashboardRoutes, teacherRoutes, studentRoutes } from './routes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        {authRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        {/* Admin Dashboard Routes */}
        {adminDashboardRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        {/* Admin Nested Routes */}
        {adminRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element}>
            {route.children?.map((child, childIndex) => (
              <Route 
                key={childIndex} 
                path={child.path} 
                element={child.element} 
                index={child.index}
              />
            ))}
          </Route>
        ))}

        {/* Teacher Routes */}
        {teacherRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}

        {/* Student Routes */}
        {studentRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
