/**
 * The container has exit.
 * @see https://docs.docker.com/engine/api/v1.41/#operation/ContainerWait
 */
export interface ContainerWaitOK {
	/**
	 * Exit code of the container
	 */
	StatusCode: number

	/**
	 * container waiting error, if any
	 */
	Error?: {
		/**
		 * Details of an error
		 */
		Message: string
	}
}
