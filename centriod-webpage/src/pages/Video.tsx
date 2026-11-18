import { useEffect, useState } from "react";

const Video =()=>{
    const [videos, setVideos]=useState<string[]>([]);
    useEffect(()=>{
        const fetchVideos=async(): Promise<void>=>{
            try{
                console.log("in effect")
                const res:Response = await fetch('/api/videos');
                const data: string[] = await res.json();
                setVideos(data);
                console.log(videos)
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
            {videos}
        </>
    )
}

export default Video;