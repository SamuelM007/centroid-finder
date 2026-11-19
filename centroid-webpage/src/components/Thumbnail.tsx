export default function Thumbnail({fileName}:{fileName:string}){
    return(
        <img src={`/api/thumbnail/${fileName}`} width={500}/>
    )
}