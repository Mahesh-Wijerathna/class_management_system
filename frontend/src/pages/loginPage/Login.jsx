// import React from 'react'
// import { Formik,Form } from 'formik'
// import * as Yup from "yup"

// export default function LoginPage() {

//   const LoginSchema = Yup.object().shape({
//     userID: Yup.string().required("Reqired"),
//     password: Yup.string().required("Required")           
//   })

//   const handleLogin = ()=> {
//     //api 
//     console.log("login succesed ");
//   }






//   return (
//     <div className='w-full flex flex-col justify-center items-center bg-white h-screen'>
//       <div className='max-w [800px] flex flex-col p-5 items-center'>
//         <div className='app-log flex flex-col justify-center items-center'>
//           <span className='text-[64px] text-[#627BFE]'>
//             TCMS
//           </span>
//            <span className='text-[18px] text-[#262626]'>
//             Please Login to Continue
//           </span>
//         </div>
//         <Formik
//           initialValues={{
//             userID:"",
//             password:"" 
//           }} 
//           validationSchema={LoginSchema}
//           onSubmit={handleLogin}
//       >

//         {({errors, touched, handleChange, values}) => (
//           <Form className='flex flex-col mb-[56px] w-full'>
//             <input
//               type='text'
//               name='userID'
//               value={values.userID}
//               placeholder='user id'
//               handleChange ={handleChange}
            
//             />
//             <input
//               type='password'
//               name='password'
//               value={values.password}
//               handleChange ={handleChange}
              
//             />

//             <button type='submit' className='p-2 bg-red-500'>Submit </button>
             
            

//           </Form>
//         )}

//       </Formik>
//       </div> 
//     </div>
//   )
// }
