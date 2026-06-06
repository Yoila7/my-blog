package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

func main() {
	listen := getEnv("LISTEN", "0.0.0.0:80")
	frontend := getEnv("FRONTEND", "http://127.0.0.1:3000")
	backend := getEnv("BACKEND", "http://127.0.0.1:8080")

	frontendURL, err := url.Parse(frontend)
	if err != nil {
		log.Fatalf("无效的 FRONTEND URL %q: %v", frontend, err)
	}
	backendURL, err := url.Parse(backend)
	if err != nil {
		log.Fatalf("无效的 BACKEND URL %q: %v", backend, err)
	}

	frontendProxy := httputil.NewSingleHostReverseProxy(frontendURL)
	backendProxy := httputil.NewSingleHostReverseProxy(backendURL)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
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
