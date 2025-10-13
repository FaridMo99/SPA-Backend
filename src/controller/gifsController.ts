import { Gif } from "../types/types";
import { Request, Response, NextFunction } from "express";

export async function getTrendingGifs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let page = req.cookies.gifsPage || 0;
    page++;
    const response = await fetch(
      `https://api.klipy.com/api/v1/${process.env.KLIPY_GIF_API_KEY}/gifs/trending?page=${page}&per_page=20`,
    );
    if (!response.ok) {
      return res.status(400).json({ message: "Something went wrong" });
    }
    res.cookie("gifsPage", page, { path: "/" });
    const gifs: Gif[] | [] = await response.json();
    return res.status(200).json(gifs);
  } catch (err) {
    next(err);
  }
}

export async function searchGifs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { search } = req.body;
  try {
    const response = await fetch(
      `https://api.klipy.com/api/v1/${process.env.KLIPY_GIF_API_KEY}/gifs/search?page=20&per_page=20&q=${search}`,
    );
    if (!response.ok) {
      return res.status(400).json({ message: "Something went wrong" });
    }
    const gifs: Gif[] | [] = await response.json();
    return res.status(200).json(gifs);
  } catch (err) {
    next(err);
  }
}
