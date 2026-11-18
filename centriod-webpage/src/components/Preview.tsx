const Preview=({fileName}:{fileName:string})=>{
    console.log('teAWSDad')
    return(
         <video src={`/api/video/${fileName}`} controls width="340" />
    )
}

export default Preview;