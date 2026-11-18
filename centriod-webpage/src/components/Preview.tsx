const Preview=({filename}:{filename:string})=>{
    console.log('teAWSDad')
    return(
         <video src={`/api/video/${filename}`} controls width="340" />
    )
}

export default Preview;