import React from 'react'


const Layout1 = ( {children}) => {
  return (
    <div  className='md:relative lg:px-0 px-2 py-[3em] mt-[2em]  flex flex-col gap-[2em]sm:py-10 md:py-[4em] w-full   mx-auto '>
        {children}
       
    </div>
  )
}

export default Layout1