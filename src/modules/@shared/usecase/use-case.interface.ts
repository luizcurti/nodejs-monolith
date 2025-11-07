export default interface UseCaseInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(input: any): Promise<any>;
}
