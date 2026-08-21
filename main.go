package main

import (
	"log"
	"mime"
	"net/http"
)

func main() {
	mime.AddExtensionType(".js", "application/javascript")
	mime.AddExtensionType(".css", "text/css")
	mime.AddExtensionType(".svg", "image/svg+xml")
	mime.AddExtensionType(".png", "image/png")
	mime.AddExtensionType(".mp3", "audio/mpeg")

	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)

	addr := ":5500"
	log.Println("serving on http://localhost:5500" + addr)
	log.Fatal(http.ListenAndServe(addr, fs))
}
