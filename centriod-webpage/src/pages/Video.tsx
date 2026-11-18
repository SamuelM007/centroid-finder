import { useEffect, useState } from "react";
import Preview from "../components/Preview";

const Video =()=>{
    const [videos, setVideos]=useState<string[]>([]);
    useEffect(()=>{
        const fetchVideos=async(): Promise<void>=>{
            try{
                const res:Response = await fetch('/api/videos');
                const data: string[] = await res.json();
                setVideos(data);
            }
            catch(error: unknown){
                console.log(error);
            }
        }
        fetchVideos();
    },[])
    console.log(videos);

    return(
        <>
        Availabe Videos:
            {videos.map((fileName)=>{
                return (<Preview filename={fileName} />)
            })}
        </>
    )
}

export default Video;