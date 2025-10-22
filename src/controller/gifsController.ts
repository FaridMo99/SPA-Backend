import { Request, Response, NextFunction } from "express";
import { GifForClient, GifsRoot } from "../types/types.js";

export async function getTrendingGifs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;

    const response = await fetch(
      `https://api.klipy.com/api/v1/${process.env.KLIPY_GIF_API_KEY}/gifs/trending?page=${page}&per_page=10`,
    );

    if (!response.ok) {
      return res.status(400).json({ message: "Something went wrong" });
    }

    const gifs: GifsRoot = await response.json();

    const gifsForClient: GifForClient[] = gifs.data.data.map((gifItem) => ({
      url: gifItem.file.md.gif.url,
      width: gifItem.file.md.gif.width,
      height: gifItem.file.md.gif.height,
      blur_preview: gifItem.blur_preview,
    }));

    return res.status(200).json({
      gifs: gifsForClient,
      current_page: gifs.data.current_page,
      per_page: gifs.data.per_page,
      has_next: gifs.data.has_next,
    });
  } catch (err) {
    next(err);
  }
}

export async function searchGifs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { search } = req.query;
  if (!search) return res.status(400).json({ message: "No search provided" });
  try {
    const response = await fetch(
      `https://api.klipy.com/api/v1/${process.env.KLIPY_GIF_API_KEY}/gifs/search?page=1&per_page=10&q=${search}`,
    );
    if (!response.ok) {
      return res.status(400).json({ message: "Something went wrong" });
    }
    const gifs: GifsRoot = await response.json();

    const gifsForClient: GifForClient[] = gifs.data.data.map((gifItem) => ({
      url: gifItem.file.md.gif.url,
      width: gifItem.file.md.gif.width,
      height: gifItem.file.md.gif.height,
      blur_preview: gifItem.blur_preview,
    }));

    return res.status(200).json(gifsForClient);
  } catch (err) {
    next(err);
  }
}
