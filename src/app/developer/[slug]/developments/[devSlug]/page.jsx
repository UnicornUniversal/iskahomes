import React from 'react'
import Development from '@/app/components/developers/AddNewDevelopment/Development'
import DeveloperNav from '@/app/components/developers/DeveloperNav'

const page = async ({ params }) => {
  const resolvedParams = params instanceof Promise ? await params : params;
  const { devSlug } = resolvedParams;
  const isAddMode = devSlug === 'addNewDevelopment';
  const developmentId = isAddMode ? null : devSlug;

  return (
    <div className='normal_div mt-10 w-full'>
      <DeveloperNav active={3} />
      <Development 
        isAddMode={isAddMode} 
        developmentId={developmentId}
      />
    </div>
  )
}

export default page
