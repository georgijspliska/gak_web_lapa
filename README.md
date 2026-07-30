# Photo site — setup

Static files only. Upload the whole folder to any web host and it works.

```
index.html      Photos
contact.html    Contact
assets/
  style.css
  main.js       <- photo list + form endpoint live at the top of this file
photos/         <- your images
```

## Add your photos

1. Drop your JPGs into `photos/`.
2. Edit the `PHOTOS` array at the top of `assets/main.js`:

```js
{ src: "photos/whatever.jpg", w: 1600, h: 1067, caption: "Title · Place" }
```

`w` and `h` are the pixel dimensions — optional, they only keep the layout from
jumping while an image loads. Any mix of portrait / landscape / square works.
Export at ~2000px on the long edge, quality 80; the desktop reel loads every
photo, so keep each file under ~400 KB.

## Logo

The wordmark is plain text in both HTML files. To use an image instead, replace
the `<a class="wordmark">` block with:

```html
<a class="wordmark" href="index.html"><img src="assets/logo.svg" alt="Studio"></a>
```

## Social links

Two `<a href="https://instagram.com/">` tags in the `nav-right` block of each
HTML file. Point them at your accounts.