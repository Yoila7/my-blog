package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

func main() {
	listen := getEnv("LISTEN", "0.0.0.0:80")
	frontend := getEnv("FRONTEND", "http://127.0.0.1:3000")
	backend := getEnv("BACKEND", "http://127.0.0.1:8080")

	frontendURL, _ := url.Parse(frontend)
	backendURL, _ := url.Parse(backend)

	frontendProxy := httputil.NewSingleHostReverseProxy(frontendURL)
	backendProxy := httputil.NewSingleHostReverseProxy(backendURL)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if len(r.URL.Path) >= 5 && r.URL.Path[:5] == "/api/" {
			backendProxy.ServeHTTP(w, r)
		} else {
			frontendProxy.ServeHTTP(w, r)
		}
	})

	log.Printf("反向代理已启动: %s", listen)
	log.Printf("  /     -> %s", frontend)
	log.Printf("  /api/ -> %s", backend)
	log.Fatal(http.ListenAndServe(listen, nil))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
