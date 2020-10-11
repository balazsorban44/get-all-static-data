# get-all-static-data

Workaround to 'return data' from Next.js's getStaticPaths

https://github.com/vercel/next.js/discussions/11272

There is no real magic here, it creates a .cache file
that `getStaticProps` will read under build, and reuses the `pathMapper`
to return the correct data.

This is based on this comment https://github.com/vercel/next.js/issues/10933#issuecomment-598297975

## Usage

Available parameters:
```ts
interface GetAllStaticDataParams<D, P> {
  /** Returns a list of data */
  getData(): Promise<D[]>
  /** Return a path segment here (This will be returned from `getStaticPaths`) */
  pathMapper(element: D): GetStaticPathsResult["paths"][0]
  /**
   * By default,
   * the `props` return property will equal to the data,
   * and `revalidate is set to `1`.
   * You can override this functino as you like.
   * It is exactly like a `getStaticProps` function, only with `context.data`
   * set to the data returned from `getStaticPaths` with a matching path.
   * See `pathMapper`
   * */
  getStaticPropsWithData?: (context: GetStaticPropsContextWithData<D>) => Promise<GetStaticPropsResult<P>>
  /** Fallback value for `getStaticPaths`. */
  fallback?: GetStaticPathsResult["fallback"]
}
```

## Example

`getAllStaticData` takes two required params, `getData` and `pathMapper`, and returns two functions
```jsx
import getAllStaticData from "get-all-static-data"

const pageData = getAllStaticData({
  async getData() {
    return [{ slug: "/testing/foo/bar", title: "Foo", updated: "2020-10-11" }]
  },
  pathMapper: element => element.slug,  
})

export const getStaticPaths = pageData.getStaticPaths(require("fs"))
export const getStaticProps = pageData.getStaticProps(require("fs"))

export default function Test({ data }) {
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```