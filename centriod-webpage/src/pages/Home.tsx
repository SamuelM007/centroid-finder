import { useEffect, useState } from "react";
import Thumbnail from "../components/Thumbnail";

const Home=()=>{
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
        Avialable Videos
        {videos.map(name=>{
            return(
                <Thumbnail fileName={name}/>
            )
        })}
        </>
    )
}

export default Home;