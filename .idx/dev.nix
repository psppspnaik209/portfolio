{ pkgs, ... }: {
  channel = "stable-26.05";
  packages = [
    pkgs.nodejs_26
  ];
  env = {};
  idx = {
    extensions = [];
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
