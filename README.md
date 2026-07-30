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

## Contact form (no backend)

You cannot send mail from a static host — the browser has nothing to send with.
A form relay does it for you: your form POSTs to their server, they email you.
Pick one, then fill in the two constants near the top of `assets/main.js`.

**Web3Forms** — no account needed, 250 messages/month free.
1. Go to web3forms.com, enter your email, they mail you an access key.
2. ```js
   const FORM_ENDPOINT = "https://api.web3forms.com/submit";
   const FORM_ACCESS_KEY = "your-key-here";
   ```

Also set `FALLBACK_EMAIL` in `main.js` — it is shown if a send fails.

The hidden `_gotcha` field in the form is a spam trap: bots fill it, people
don't, and the script drops anything that has it filled.

If you would rather run it yourself, a small PHP file using `mail()` on a host
with sendmail works too — but then it is no longer a purely static site, and
mail sent straight from a cheap shared host usually lands in spam.