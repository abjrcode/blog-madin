+++
title = "Cross Wails"
description = "Wails, Golang, CGO and Cross Compilation"
weight = 4
insert_anchor_links = "right"

[extra]
type = "standalone"
date = "2023-10-28T00:00:00Z"
+++

# Wails

[Wails](https://wails.io/) is a framework for building cross platform desktop applications using Go and Web Technologies. It is similar to [Electron](https://www.electronjs.org/) and [Tauri](https://tauri.app/) but uses Go instead of JavaScript and Rust, respectively.

It still allows you to use whatever technology _(React, Vue, Svelte etc...)_ you want for the frontend part<sup><a href="#no_server_side">1</a></sup>

## The Lure of Go

I personally find Golang to be a very simple and minimalistic language. That is something I find very attractive because it allows me to focus _less on the language and its runtime_ and more on the problem I am actually trying to solve. Add on top the ability to cross-compile<sup><a href="#cross_compile">2</a></sup> to almost any platform and things cannot be any better. All in a single self-contained binary.

## So what's the catch?

Cross-compilation with CGO!

See, while Go does allow you to cross-compile to any platform & architecture combination, you will need to have "some plumbing" in place when you want to use CGO!

What's CGO you might ask? Well, [it's a way to call C code from Go](https://go.dev/blog/cgo).

You might be thinking: I rarely ever have to do that and you're probably right. Except...

## Third Party Dependencies

No man is an island as the saying goes. We all depend on third party libraries and frameworks to get our work done. And some of these libraries and frameworks might be written in C or C++.

Matter of fact, I ran into this on my very first Go application. I was trying to use [Sqlite](https://github.com/mattn/go-sqlite3) and guess what! it relies on CGO.

## The Not So Fun Part

This was very confusing and frustrating to me when I came across it. I thought Go took care of all of this for me and I can just enjoy my life but nope, not so easy!

To pause for a moment here, none of this is an issue if you can afford to build your application on the target platform. That is, you can arrange all sorts of different build agents, like a Windows one, an OSX one, a Linux one and so on, and hey, don't forget about the different architectures too: AMD64, ARM64 etc...

I simply use GitHub Actions for most of my projects and I cannot afford the luxury of having all these different configurations. Also, [GitHub Actions don't support ARM64](https://github.com/actions/runner-images/issues/5631), yet!

The solution is to cross-compile. Not only does it allow you to build for different platforms and architectures, it also allows you to build for them on a single machine.

## The Plumbing

Simply put: it boils down to installing the correct cross-compilers for the target platform and architecture you want to build for. To be honest, it cannot be further from simple. At least for me, as I never had to deal with this before coming from working with managed languages like C#, JavaScript, Python etc...

Essentially we need to have a compiler that say, can run on Linux AMD64 and output binary code for MacOS ARM64 and so on and so forth.

Also, Wails itself depends on GTK and WebKit. So we need to have the correct versions of those libraries installed as well.

## Cross Wails

After many trials and errors and experimenting with various solutions - I discovered [goreleaser-cross](https://github.com/goreleaser/goreleaser-cross) which is a Docker image that allows you to do just that. It had everything I needed except for the GTK, WebKit, NodeJS and Wails itself of course.

I initially started using it in my project but then I realized the image itself is `10GB` in size.
That was an issue for a couple of reasons:

1. It was taking a long time to download and build the image
2. My CI/CD pipeline was slow and there is nothing more frustrating than a slow CI/CD pipeline. You really want that fast feedback loop

I decided to spend some time and trim this image to the bare minimum I need for my use cases: Linux AMD64, Linux ARM64 and Windows AMD64.

The result is a `4.2GB` image that I am using in my projects and it is working great so far as I managed to also reduce my build time from `10` minutes to `6` _(not a lot but it is something)_

I have published it [here](https://github.com/abjrcode/cross-wails/tree/main) as open-source so please feel free to use it in your projects as well.

### Usage

You can use the image in your CI/CD pipeline or even when building locally for different platforms.

For a full example, please check out [cross-wails/example](https://github.com/abjrcode/cross-wails/tree/main/example)

Here is an example `Dockerfile` you would put in the root of your Wails project:

```dockerfile
ARG BASE_IMAGE=ghcr.io/abjrcode/cross-wails:v2.6.0

FROM ${BASE_IMAGE} as builder

WORKDIR /usr/src/app

COPY go.mod go.sum ./

RUN go mod download

COPY . .


# Docker injects the value of BUILDARCH into the build process
ARG BUILDARCH

# Needed atm due to https://github.com/wailsapp/wails/issues/1921
RUN set -exo pipefail; \
  if [ "${BUILDARCH}" = "amd64" ]; then \
    GOOS=linux GOARCH=amd64 CC=x86_64-linux-gnu-gcc wails build -platform linux/amd64 -o example-amd64; \
    GOOS=linux GOARCH=arm64 CC=aarch64-linux-gnu-gcc wails build -skipbindings -s -platform linux/arm64 -o example-arm64; \
    GOOS=windows GOARCH=amd64 CC=x86_64-w64-mingw32-gcc wails build -skipbindings -s -platform windows/amd64; \
  else \
    GOOS=linux GOARCH=arm64 CC=aarch64-linux-gnu-gcc wails build -platform linux/arm64 -o example-arm64; \
    GOOS=linux GOARCH=amd64 CC=x86_64-linux-gnu-gcc wails build -skipbindings -s -platform linux/amd64 -o example-amd64; \
    GOOS=windows GOARCH=amd64 CC=x86_64-w64-mingw32-gcc wails build -skipbindings -s -platform windows/amd64; \
  fi;

ENTRYPOINT [ "/bin/bash" ]

#############################################################

FROM ${BASE_IMAGE}

COPY --from=builder /usr/src/app/build/bin /out

ENTRYPOINT [ "sh", "-c" ]
CMD [ "cp -r /out/. /artifacts/" ]
```

Which you could then use to get the build artifacts by running:

```bash
docker build -t example_builder .
docker run --rm -v $(pwd)/build/bin:/artifacts example_builder
```

### Image Contents

The [source code](https://github.com/abjrcode/cross-wails) is the truth but here is a high level overview of what's in the image:

- The image is based on [`debian:bullseye`](https://hub.docker.com/_/debian). I tried using `bookworm` but I ran into a problem that was too time consuming for me to figure out. So I decided to stick with `bullseye` for now.
- It has `go` installed and available in `PATH`
- It has `wails` installed and available in `PATH`
- It has `CGO_ENABLED=1` set in the environment
- It has `NodeJS` installed and available in `PATH`
- It doesn't have a C++ compiler installed. I simply did not need it and I could save some space by not having it installed.

### One Gotcha

Wails doesn't support cross-compiling to MacOS yet. So you will need to build your MacOS binaries on a MacOS machine. Luckily, GitHub Actions have a MacOS runner and it works out of the box with CGO.

## Final Thoughts

While the above image is meant to be used with Wails, it can be used with any Go project that needs needs to cross-compile to Linux AMD64, Linux ARM64 and Windows AMD64.

Feel free to copy the contents of the Docker file and adjust them to your needs.

And finally, If you think I am missing something here or there is a better or simpler way to do this, I would love to hear about it.

<ol id="footnotes"> 
 <li id="no_server_side">Unfortunately, it doesn't "fully" support using server side technologies. e.g. if you want to build your application with Go <code>text/html</code> templates or other templating languages. I say "fully" because you can get it to work but the development experience won't be as nice as when you use full client side frameworks</li>
 <li id="cross_compile">Cross compilation is, simply put, when you can compile an application on one platform (e.g. linux) to produce an executable that can run on another platform (e.g. Windows)</li>
</ol>
