<?php

class OfflineClientBuilder {
  const targets_path = 'lib/dynacase-offline/client/targets';
  const xulruntimes_path = 'lib/dynacase-offline/xulruntimes';
  const xulapp_path = 'lib/dynacase-offline/client/xulapp';

  private $targets_path = '';
  private $xulruntimes_path = '';
  private $xulapp_path = '';

  public $error = '';

  public function __construct() {
    $this->_initPath();
    return $this;
  }

  private function _initPath() {
    include_once('WHAT/Lib.Prefix.php');

    $this->targets_path = sprintf('%s/%s', $pubdir, self::targets_path);
    $this->xulruntimes_path = sprintf('%s/%s', $pubdir, self::xulruntimes_path);
    $this->xulapp_path = sprintf('%s/%s', $pubdir, self::xulapp_path);

    return true;
  }

  public function build($os, $arch, $prefix, $outputFile) {
    include_once('WHAT/Lib.Common.php');

    if( strpos($os, '/') !== false ) {
      $this->error = sprintf("Malformed OS '%s' (cannot contains '/').", $os);
      return false;
    }
    if( strpos($arch, '/') !== false ) {
      $this->error = sprintf("Marlformed architecture '%s' (cannot contains '/').", $arch);
      return false;
    }

    $target_dir = sprintf("%s/%s/%s", $this->targets_path, $os, $arch);
    if( ! is_dir($target_dir) ) {
      $this->error = sprintf("Target directory '%s' is not a valid directory.", $target_dir);
      return false;
    }
    $build_script = sprintf('%s/build.sh', $target_dir);
    if( ! is_file($build_script) ) {
      $this->error = sprintf("Build script '%s' is not a valid file.", $build_script);
      return false;
    }
    if( ! is_executable($build_script) ) {
      $this->error = sprintf("Build script '%s' is not executable.", $build_script);
      return false;
    }

    $tmpfile = tempnam(getTmpDir(), __CLASS__);
    if( $tmpfile === false ) {
      $this->error = sprintf("Could not create temporary file.");
      return false;
    }

    $cwd = getcwd();

    $ret = chdir($target_dir);
    if( $ret === false ) {
      $this->error = sprintf("Could not chdir to '%s'.", $target_dir);
      return false;
    }

    $cmd = sprintf('%s %s %s > %s 2>&1', escapeshellarg($build_script), escapeshellarg($prefix), escapeshellarg($outputFile), escapeshellarg($tmpfile));
    $out = system($cmd, $ret);
    if( $ret !== 0 ) {
      $this->error = sprintf("Error building client for {os='%s', arch='%s', prefix='%s', outputFile='%s'}: %s", $os, $arch, $prefix, $outputFile, file_get_contents($tmpfile));
      unlink($tmpfile);
      chdir($cwd);
      return false;
    }
    unlink($tmpfile);
    chdir($cwd);

    return true;
  }

  public function test() {
    foreach( array(
		   array('linux', 'i686', 'linux_i686', '/tmp/out.linux_i686'),
		   array('linux', 'x86_64', 'linux_x86_64', '/tmp/out.linux_x86_64'),
		   array('mac', 'universal', 'mac_universal', '/tmp/out.mac_universal'),
		   array('win', '32', 'win_32', '/tmp/out.win_32')
		   ) as $argv ) {
      print sprintf("Building %s/%s... ", $argv[0], $argv[1]);
      $ret = call_user_func_array(array($this, 'build'), $argv);
      if( $ret === false ) {
	print "[ERROR]\n";
	print sprintf("%s\n", $this->error);
	print "\n";
      } else {
	print "[OK]\n";
      }
    }
  }

}

?>