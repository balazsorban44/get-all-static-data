import {
  GetStaticPaths, GetStaticPathsResult, GetStaticProps, GetStaticPropsContext, GetStaticPropsResult
} from "next"

export type GetStaticPropsContextWithData<D = undefined> = GetStaticPropsContext & {
  data: D
}

export async function defaultGetStaticProps (ctx: GetStaticPropsContextWithData) {
  return {
    props: ctx.data,
    revalidate: 1
  }
}

export interface GetAllStaticDataParams<D, P> {
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

export default function getAllStaticData<D, P>({
  getData,
  pathMapper,
  getStaticPropsWithData = defaultGetStaticProps,
  fallback = false
}: GetAllStaticDataParams<D, P>) {
  const getStaticPaths: (fs: typeof import("fs")) => GetStaticPaths = (fs) =>
    async (): Promise<GetStaticPathsResult> => {
      const result = await getData()
      await fs.promises.writeFile(".cache", JSON.stringify(result), "utf8")
      return {
        fallback,
        paths: result.map(pathMapper)
      }
    }

  const getStaticProps: (fs: typeof import("fs")) => GetStaticProps = (fs) =>
    async (ctx) => {
      const result = await fs.promises.readFile(".cache", "utf8")
      return getStaticPropsWithData({...ctx, data: JSON.parse(result).find(pathMapper)})
    }

  return { getStaticPaths, getStaticProps }
}
