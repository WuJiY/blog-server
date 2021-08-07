export interface TencentCret {
  credential: {
    secretId: string
    secretKey: string
  }
  captcha: {
    CaptchaAppId: number
    AppSecretKey: string
  }
}

export interface DbConfig {
  ip: string
  user: string
  pass: string
}
